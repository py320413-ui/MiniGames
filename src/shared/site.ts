/**
 * [역할]
 *   사이트 전역 상수와 URL 조립 함수. 도메인·경로·로케일의 단일 진실 공급원이다.
 *   vite.config.ts, scripts/gen-pages.mjs, 브라우저 코드가 모두 이 파일을 읽는다.
 *
 * [구성 순서]
 *   1. 도메인과 경로
 *   2. 로케일
 *   3. URL 조립 함수
 *
 * [주의]
 *   - 커스텀 도메인으로 옮기면 SITE_ORIGIN과 BASE_PATH 두 줄만 바꾸면 되도록 설계했다.
 *     다른 파일 어디에도 '/MiniGames/' 같은 경로를 하드코딩하지 말 것.
 *   - 이 파일은 브라우저 API를 쓰지 않는다. Node(빌드 스크립트)에서도 그대로 import된다.
 *     window·document를 여기에 넣는 순간 빌드가 깨진다.
 */

// ══════════════════════════════════════════════════════════════
// 1. 도메인과 경로
// ══════════════════════════════════════════════════════════════

/** 프로토콜 + 호스트. 끝에 슬래시 없음. */
export const SITE_ORIGIN = 'https://py320413-ui.github.io';

/**
 * 사이트가 올라가는 하위 경로. 앞뒤 슬래시 포함.
 * 프로젝트 리포(py320413-ui/MiniGames)라 하위 경로에 배포된다.
 * 커스텀 도메인을 붙이면 '/' 로 바꾼다.
 */
export const BASE_PATH = '/MiniGames/';

/** 사이트 루트의 절대 URL. 끝에 슬래시 포함. */
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;

// ══════════════════════════════════════════════════════════════
// 2. 로케일
// ══════════════════════════════════════════════════════════════

/** 지원 로케일. 여기에 추가하면 페이지 생성·언어전환기·sitemap이 자동으로 따라온다. */
export const LOCALES = ['ko', 'en', 'ja'] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * 기본 로케일. URL에 접두사가 붙지 않는 언어다.
 * 바꾸면 모든 URL이 변해서 쌓아둔 SEO를 잃는다. 건드리지 말 것.
 */
export const DEFAULT_LOCALE: Locale = 'ko';

/** hreflang="x-default"가 가리킬 로케일. 국제 방문자 기준이라 영어로 둔다. */
export const X_DEFAULT_LOCALE: Locale = 'en';

/** <html lang="..."> 에 넣을 값. */
export const HTML_LANG: Record<Locale, string> = {
  ko: 'ko',
  en: 'en',
  ja: 'ja',
};

/** 언어 전환기에 표시할 이름. 각 언어를 그 언어로 적는다. */
export const LOCALE_LABEL: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
};

// ══════════════════════════════════════════════════════════════
// 3. URL 조립 함수
// ══════════════════════════════════════════════════════════════

/** 로케일 경로 접두사. 기본 로케일은 접두사가 없다. */
export function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? '' : `${locale}/`;
}

/**
 * 사이트 내부 절대경로(base 포함)를 만든다.
 * path는 앞 슬래시 없이 'games/yacht/' 형태로 넘긴다.
 *
 *   sitePath('ko')                    → '/MiniGames/'
 *   sitePath('en', 'games/yacht/')    → '/MiniGames/en/games/yacht/'
 */
export function sitePath(locale: Locale, path = ''): string {
  return `${BASE_PATH}${localePrefix(locale)}${path}`;
}

/**
 * 검색엔진용 절대 URL을 만든다. canonical·hreflang·OG·sitemap이 전부 이걸 쓴다.
 *
 *   siteUrl('ja', 'games/yacht/')     → 'https://py320413-ui.github.io/MiniGames/ja/games/yacht/'
 */
export function siteUrl(locale: Locale, path = ''): string {
  return `${SITE_ORIGIN}${sitePath(locale, path)}`;
}

/**
 * 현재 브라우저 경로에서 로케일을 알아낸다.
 * 경로에 로케일 접두사가 없으면 기본 로케일이다.
 */
export function localeFromPath(pathname: string): Locale {
  const rest = pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname.replace(/^\//, '');
  const first = rest.split('/')[0];
  return LOCALES.find((l) => l === first) ?? DEFAULT_LOCALE;
}

/**
 * 같은 페이지의 다른 로케일 경로를 만든다. 언어 전환기가 쓴다.
 * pathname은 location.pathname 을 그대로 넘기면 된다.
 */
export function switchLocalePath(pathname: string, to: Locale): string {
  const current = localeFromPath(pathname);
  const rest = pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname.replace(/^\//, '');
  const withoutLocale = current === DEFAULT_LOCALE ? rest : rest.slice(`${current}/`.length);
  return sitePath(to, withoutLocale);
}
