/**
 * [역할]
 *   HTML 문자열을 조립한다. scripts/gen-pages.mjs 가 이 함수들로 페이지를 찍어낸다.
 *
 * [구성 순서]
 *   1. 이스케이프
 *   2. <head> — 메타·canonical·hreflang·OG
 *   3. 헤더 · 푸터
 *   4. renderPage() — 페이지 한 장 전체
 *
 * [왜 템플릿 파일이 아니라 TS인가]
 *   .html 템플릿에 {{자리표시자}}를 박는 방식은 타입 검사도 i18n 키 검사도 못 받는다.
 *   여기 두면 메시지 키 오타와 로케일 누락이 빌드에서 잡힌다.
 *
 * [주의]
 *   - 이 파일은 Node 에서 실행된다. document·window 를 절대 쓰지 말 것.
 *   - 경로는 전부 site.ts 의 sitePath()/siteUrl() 로 만든다. 문자열을 직접 잇지 말 것.
 */
import {
  LOCALES,
  LOCALE_LABEL,
  HTML_LANG,
  X_DEFAULT_LOCALE,
  sitePath,
  siteUrl,
  type Locale,
} from './site.ts';
import { t } from './i18n/index.ts';

// ══════════════════════════════════════════════════════════════
// 1. 이스케이프
// ══════════════════════════════════════════════════════════════

/** HTML 본문·속성에 넣을 문자열을 안전하게 만든다. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ══════════════════════════════════════════════════════════════
// 2. <head>
// ══════════════════════════════════════════════════════════════

/** 이모지 하나로 파비콘을 만든다. 별도 이미지 파일이 필요 없다. */
function emojiFavicon(emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * 같은 페이지의 모든 언어판을 서로 연결한다.
 * 이게 있어야 구글이 "번역판이지 중복 콘텐츠가 아니다"라고 이해한다.
 */
function renderHreflang(path: string): string {
  const links = LOCALES.map(
    (locale) =>
      `<link rel="alternate" hreflang="${HTML_LANG[locale]}" href="${escapeHtml(siteUrl(locale, path))}">`,
  );
  links.push(
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(siteUrl(X_DEFAULT_LOCALE, path))}">`,
  );
  return links.join('\n    ');
}

function renderHead(locale: Locale, path: string, title: string, description: string, relRoot: string): string {
  const canonical = siteUrl(locale, path);
  return `<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    ${renderHreflang(path)}
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${escapeHtml(t(locale, 'site.name'))}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:locale" content="${HTML_LANG[locale]}">
    <meta name="twitter:card" content="summary">
    <link rel="icon" href="${emojiFavicon('🎮')}">
    <link rel="stylesheet" href="${relRoot}src/shared/styles/main.css">`;
}

// ══════════════════════════════════════════════════════════════
// 3. 헤더 · 푸터
// ══════════════════════════════════════════════════════════════

/**
 * 언어 전환기. 평범한 <a> 목록이라 자바스크립트 없이 동작하고 크롤러도 따라간다.
 * select 로 만들면 JS 없이는 안 움직이고 크롤러도 링크를 못 본다.
 */
function renderLangSwitcher(locale: Locale, path: string): string {
  const items = LOCALES.map((target) => {
    const current = target === locale;
    return `<a class="lang-link${current ? ' is-current' : ''}" href="${escapeHtml(sitePath(target, path))}" hreflang="${HTML_LANG[target]}" lang="${HTML_LANG[target]}"${current ? ' aria-current="true"' : ''}>${escapeHtml(LOCALE_LABEL[target])}</a>`;
  });
  return `<nav class="lang-switcher" aria-label="${escapeHtml(t(locale, 'lang.label'))}">${items.join('')}</nav>`;
}

function renderHeader(locale: Locale, path: string): string {
  return `<header class="site-header">
      <div class="wrap site-header__inner">
        <a class="brand" href="${escapeHtml(sitePath(locale))}">
          <span class="brand__mark" aria-hidden="true">🎮</span>
          <span class="brand__name">${escapeHtml(t(locale, 'site.name'))}</span>
        </a>
        ${renderLangSwitcher(locale, path)}
      </div>
    </header>`;
}

function renderFooter(locale: Locale): string {
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
      <div class="wrap">
        <p class="site-footer__tagline">${escapeHtml(t(locale, 'site.tagline'))}</p>
        <p class="site-footer__rights">${escapeHtml(t(locale, 'footer.rights', { year }))}</p>
      </div>
    </footer>`;
}

// ══════════════════════════════════════════════════════════════
// 4. renderPage()
// ══════════════════════════════════════════════════════════════

export interface PageOptions {
  locale: Locale;
  /** 로케일 접두사를 뺀 경로 조각. 허브는 '', 게임은 'games/yacht/'. */
  path: string;
  /** <title> 에 그대로 들어간다. 사이트명은 부르는 쪽에서 붙인다. */
  title: string;
  description: string;
  /** <main> 안쪽 HTML. */
  main: string;
  /**
   * 생성된 HTML 에서 프로젝트 루트까지의 상대경로. 끝에 슬래시 포함.
   * 예) .generated/en/games/yacht/index.html → '../../../../'
   */
  relRoot: string;
  /** 이 페이지가 추가로 로드할 모듈. 프로젝트 루트 기준 경로로 넘긴다. */
  moduleSrc?: string;
}

/**
 * 페이지 한 장을 통째로 만든다.
 *
 * 헤더·푸터·본문을 전부 정적 HTML로 박아 넣는다. JS로 그리면 크롤러가 내부 링크를
 * 못 보고, 사용자는 깜빡임을 본다. shell.ts 는 언어 제안 배너 같은 동적인 것만 맡는다.
 */
export function renderPage(options: PageOptions): string {
  const { locale, path, title, description, main, relRoot, moduleSrc } = options;
  const extraScript = moduleSrc
    ? `\n    <script type="module" src="${relRoot}${moduleSrc}"></script>`
    : '';

  return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
  <head>
    ${renderHead(locale, path, title, description, relRoot)}
  </head>
  <body>
    <a class="skip-link" href="#content">${escapeHtml(t(locale, 'skip.toContent'))}</a>
    ${renderHeader(locale, path)}
    <main id="content" class="wrap">
${main}
    </main>
    ${renderFooter(locale)}
    <script type="module" src="${relRoot}src/shared/shell.ts"></script>${extraScript}
  </body>
</html>
`;
}
