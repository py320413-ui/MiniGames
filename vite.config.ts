/**
 * [역할]
 *   Vite 설정. 이 사이트는 MPA(다중 페이지)다 — 게임마다, 언어마다 진짜 HTML 페이지를 만든다.
 *
 * [구조]
 *   scripts/gen-pages.mjs 가 프로젝트 루트에 HTML을 찍고(index.html, en/index.html, …),
 *   어떤 파일을 만들었는지 .generated/manifest.json 에 적어둔다.
 *   여기서는 그 목록을 읽어 rollup 진입점으로 등록한다.
 *
 * [왜 루트에 HTML을 두나]
 *   처음엔 .generated/ 를 Vite root 로 잡았는데, 생성된 HTML이 ../src/... 를 참조하면
 *   root 를 벗어나서 dev 서버가 404 를 냈다. src/ 가 root 안에 있어야 경로가 풀린다.
 *   Vite MPA 의 관례도 HTML 진입점을 프로젝트 루트에 두는 쪽이다.
 *
 * [주의]
 *   루트의 index.html · en/ · ja/ · games/ 는 전부 **생성물**이다. 손으로 고치지 말 것.
 *   고칠 곳은 src/shared/html.ts 와 scripts/gen-pages.mjs 다.
 */
import { defineConfig } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_PATH } from './src/shared/site.ts';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(projectRoot, '.generated/manifest.json');

/**
 * gen-pages.mjs 가 남긴 목록을 rollup 진입점 맵으로 바꾼다.
 * 키가 출력 경로가 되므로 디렉터리 구조를 그대로 살린다.
 *   'en/games/yacht/index.html' → 키 'en/games/yacht'
 *
 * 매니페스트를 쓰는 이유: 루트를 훑어 index.html 을 찾으면 node_modules 까지 뒤지게 된다.
 */
function entriesFromManifest(): Record<string, string> {
  if (!existsSync(manifestPath)) return {};

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { files?: string[] };
  const entries: Record<string, string> = {};

  for (const file of manifest.files ?? []) {
    const key = file === 'index.html' ? 'index' : file.replace(/\/index\.html$/, '');
    entries[key] = resolve(projectRoot, file);
  }
  return entries;
}

export default defineConfig({
  root: projectRoot,
  base: BASE_PATH,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: entriesFromManifest(),
    },
  },
  server: {
    port: 5173,
  },
});
