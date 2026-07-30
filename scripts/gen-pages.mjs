/**
 * [역할]
 *   로케일 × 페이지 조합만큼 HTML 진입점을 **프로젝트 루트**에 찍어낸다.
 *   sitemap.xml 과 robots.txt 도 여기서 만든다.
 *
 * [실행 시점]
 *   package.json 의 predev / prebuild 가 자동으로 돌린다. 수동 실행은 `npm run gen`.
 *
 * [구성 순서]
 *   1. 경로와 도우미
 *   2. 이전 산출물 정리
 *   3. 라우트 수집
 *   4. HTML 쓰기 + 매니페스트
 *   5. sitemap.xml · robots.txt
 *
 * [왜 매니페스트를 쓰나]
 *   생성물이 프로젝트 루트에 섞여 있어서 'rm -rf games/' 같은 걸 하면 위험하다.
 *   대신 만든 파일 목록을 .generated/manifest.json 에 남기고, 다음 실행 때 **그 목록에
 *   적힌 것만** 지운다. 손으로 만든 파일은 절대 건드리지 않는다.
 *   vite.config.ts 도 이 매니페스트를 읽어 진입점을 등록한다.
 *
 * [왜 .mjs 인데 .ts 를 import 하나]
 *   Node 24 는 타입 스트리핑으로 .ts 를 그대로 실행한다. 덕분에 게임 목록과 번역을
 *   TS 원본에서 직접 읽는다 — 빌드용 사본이 따로 없으니 어긋날 일도 없다.
 *   대신 src/ 에서 enum·namespace 를 쓰면 여기서 깨진다. 유니온 타입으로만 쓸 것.
 */
import { mkdir, readFile, readdir, rm, rmdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_LOCALE,
  HTML_LANG,
  LOCALES,
  SITE_URL,
  X_DEFAULT_LOCALE,
  localePrefix,
  siteUrl,
} from '../src/shared/site.ts';
import { LIVE_GAMES, gamePath } from '../src/shared/games.ts';
import { t } from '../src/shared/i18n/index.ts';
import { escapeHtml, renderPage } from '../src/shared/html.ts';
import { renderHubMain } from '../src/shared/hub.ts';

// ══════════════════════════════════════════════════════════════
// 1. 경로와 도우미
// ══════════════════════════════════════════════════════════════

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(projectRoot, '.generated/manifest.json');
const publicDir = resolve(projectRoot, 'public');
const contentDir = resolve(projectRoot, 'content');

/** 루트 기준 상대경로. 매니페스트와 로그에 쓴다. 항상 슬래시로 통일한다. */
function toRelative(filePath) {
  return relative(projectRoot, filePath).replace(/\\/g, '/');
}

/** 로케일 + 경로 → 실제로 쓸 파일 위치. */
function outputPathFor(locale, path) {
  return resolve(projectRoot, `${localePrefix(locale)}${path}index.html`);
}

/**
 * 생성된 HTML 에서 프로젝트 루트까지 거슬러 올라가는 상대경로.
 * <link href> 와 <script src> 가 src/ 를 가리키는 데 쓴다.
 */
function relRootFor(filePath) {
  const rel = toRelative(dirname(filePath));
  return rel === '' ? './' : `${'../'.repeat(rel.split('/').length)}`;
}

/** 게임 규칙 설명 본문을 읽는다. 아직 없으면 빈 문자열 + 경고. */
async function readRules(locale, slug) {
  try {
    return await readFile(resolve(contentDir, locale, `${slug}-rules.html`), 'utf8');
  } catch {
    console.warn(`  ! 규칙 본문 없음: content/${locale}/${slug}-rules.html`);
    return '';
  }
}

// ══════════════════════════════════════════════════════════════
// 2. 이전 산출물 정리
// ══════════════════════════════════════════════════════════════

/** 빈 디렉터리를 루트 방향으로 거슬러 올라가며 지운다. 루트 자체는 건드리지 않는다. */
async function pruneEmptyDirs(startDir) {
  let current = startDir;
  while (current !== projectRoot && current.startsWith(projectRoot)) {
    try {
      if ((await readdir(current)).length > 0) return;
      await rmdir(current);
    } catch {
      return;
    }
    current = dirname(current);
  }
}

/** 지난번에 만든 파일만 골라 지운다. 매니페스트에 없는 건 손대지 않는다. */
async function cleanPrevious() {
  let files = [];
  try {
    files = JSON.parse(await readFile(manifestPath, 'utf8')).files ?? [];
  } catch {
    return; // 첫 실행이면 정리할 게 없다.
  }

  for (const rel of files) {
    const file = resolve(projectRoot, rel);
    await rm(file, { force: true });
    await pruneEmptyDirs(dirname(file));
  }
}

// ══════════════════════════════════════════════════════════════
// 3. 라우트 수집
// ══════════════════════════════════════════════════════════════

/** 게임 페이지 <main> 안쪽. 게임 컨테이너 + 광고 자리 + 규칙 본문. */
function renderGameMain(locale, game, rulesHtml) {
  const text = game.i18n[locale];
  return `      <h1 class="page-title">${escapeHtml(text.title)}</h1>
      <div id="game" class="game-root" data-game="${escapeHtml(game.slug)}"></div>
      <div class="ad-slot" data-ad-slot="game-below" hidden></div>
      <div class="rules prose">
${rulesHtml}
      </div>`;
}

async function collectRoutes() {
  const routes = [];

  for (const locale of LOCALES) {
    // 허브
    routes.push({
      locale,
      path: '',
      title: `${t(locale, 'site.name')} | ${t(locale, 'site.tagline')}`,
      description: t(locale, 'site.description'),
      main: renderHubMain(locale),
    });

    // 게임 페이지 — status: 'live' 인 것만. 'soon' 은 허브 카드로만 뜬다.
    for (const game of LIVE_GAMES) {
      const text = game.i18n[locale];
      routes.push({
        locale,
        path: gamePath(game.slug),
        title: `${text.title} | ${t(locale, 'site.name')}`,
        description: text.description,
        main: renderGameMain(locale, game, await readRules(locale, game.slug)),
        moduleSrc: `src/games/${game.slug}/main.ts`,
      });
    }
  }

  return routes;
}

// ══════════════════════════════════════════════════════════════
// 4. HTML 쓰기 + 매니페스트
// ══════════════════════════════════════════════════════════════

async function writeRoutes(routes) {
  const written = [];

  for (const route of routes) {
    const filePath = outputPathFor(route.locale, route.path);
    const html = renderPage({
      locale: route.locale,
      path: route.path,
      title: route.title,
      description: route.description,
      main: route.main,
      relRoot: relRootFor(filePath),
      moduleSrc: route.moduleSrc,
    });

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, html, 'utf8');

    const rel = toRelative(filePath);
    written.push(rel);
    console.log(`  + ${rel}`);
  }

  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify({ files: written }, null, 2)}\n`, 'utf8');
  return written;
}

// ══════════════════════════════════════════════════════════════
// 5. sitemap.xml · robots.txt
// ══════════════════════════════════════════════════════════════

/**
 * 모든 언어판을 xhtml:link 로 묶은 sitemap.
 *
 * [주의] 프로젝트 리포로 배포하는 동안 robots.txt 는 크롤러에게 무시된다.
 *        크롤러는 도메인 루트(py320413-ui.github.io/robots.txt)만 읽는데 그건 우리 것이 아니다.
 *        그래서 sitemap 은 Google Search Console 에 직접 제출해야 한다.
 *        커스텀 도메인을 붙이면 그때부터 robots.txt 가 실제로 동작한다.
 */
function renderSitemap(paths) {
  const urls = paths
    .map((path) => {
      // 각 언어판 + x-default. HTML 의 hreflang 과 같은 집합이어야 한다.
      const pairs = [
        ...LOCALES.map((locale) => [HTML_LANG[locale], locale]),
        ['x-default', X_DEFAULT_LOCALE],
      ];
      const alternates = pairs
        .map(
          ([hreflang, locale]) =>
            `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeHtml(siteUrl(locale, path))}"/>`,
        )
        .join('\n');

      return `  <url>
    <loc>${escapeHtml(siteUrl(DEFAULT_LOCALE, path))}</loc>
${alternates}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

async function writeSiteFiles(routes) {
  const paths = [...new Set(routes.map((route) => route.path))];

  await mkdir(publicDir, { recursive: true });
  await writeFile(resolve(publicDir, 'sitemap.xml'), renderSitemap(paths), 'utf8');
  await writeFile(
    resolve(publicDir, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`,
    'utf8',
  );
  console.log(`  + public/sitemap.xml (${paths.length}개 경로)`);
  console.log('  + public/robots.txt');
}

// ══════════════════════════════════════════════════════════════

async function main() {
  console.log('페이지 생성 시작');
  await cleanPrevious();

  const routes = await collectRoutes();
  await writeRoutes(routes);
  await writeSiteFiles(routes);

  console.log(`완료 — HTML ${routes.length}장 (${LOCALES.length}개 언어)`);
}

await main();
