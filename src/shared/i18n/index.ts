/**
 * [역할]
 *   메시지 조회 함수 t() 와 브라우저 언어 판별.
 *
 * [구성 순서]
 *   1. 카탈로그 등록
 *   2. t() — 메시지 조회와 치환
 *   3. 브라우저 언어 판별
 *
 * [주의]
 *   이 파일은 Node(scripts/gen-pages.mjs)에서도 import 된다.
 *   그래서 navigator·window 를 모듈 최상단에서 건드리면 빌드가 깨진다.
 *   브라우저 값은 반드시 호출하는 쪽에서 인자로 넘긴다 — matchLocale() 을 볼 것.
 */
import { ko, type MessageKey } from './ko.ts';
import { en } from './en.ts';
import { ja } from './ja.ts';
import { LOCALES, type Locale } from '../site.ts';

export type { MessageKey };

// ══════════════════════════════════════════════════════════════
// 1. 카탈로그 등록
// ══════════════════════════════════════════════════════════════

/** 언어를 추가하려면 카탈로그 파일을 만들고 여기에 한 줄 등록한다. */
const CATALOGS: Record<Locale, Record<MessageKey, string>> = { ko, en, ja };

// ══════════════════════════════════════════════════════════════
// 2. t() — 메시지 조회와 치환
// ══════════════════════════════════════════════════════════════

/** {name} 자리에 넣을 값들. */
export type MessageVars = Record<string, string | number>;

/**
 * 메시지를 가져오고 {변수}를 치환한다.
 *
 *   t('ko', 'footer.rights', { year: 2026 })  → '© 2026 미니게임 모음'
 */
export function t(locale: Locale, key: MessageKey, vars?: MessageVars): string {
  const template = CATALOGS[locale][key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole,
  );
}

/** 로케일을 미리 묶어둔 t. 한 페이지 안에서 같은 로케일을 반복해 넘기지 않으려고 쓴다. */
export function translator(locale: Locale) {
  return (key: MessageKey, vars?: MessageVars): string => t(locale, key, vars);
}

// ══════════════════════════════════════════════════════════════
// 3. 브라우저 언어 판별
// ══════════════════════════════════════════════════════════════

/**
 * 방문자가 선호하는 언어 목록에서 우리가 지원하는 첫 로케일을 찾는다.
 * navigator.languages 를 그대로 넘기면 된다. 지원하는 게 없으면 null.
 *
 * 'ja-JP' 처럼 지역이 붙어 와도 앞부분만 보고 판단한다.
 *
 * [주의] 이 결과로 **강제 리다이렉트를 하지 않는다.** 배너로 제안만 한다.
 *        강제로 보내면 크롤러가 한 언어만 보고 가서 다국어 SEO가 무너진다.
 */
export function matchLocale(preferred: readonly string[]): Locale | null {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if (base === undefined) continue;
    const hit = LOCALES.find((locale) => locale === base);
    if (hit) return hit;
  }
  return null;
}
