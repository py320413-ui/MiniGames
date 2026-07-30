/**
 * [역할]
 *   모든 페이지에서 도는 공용 스크립트. 정적 HTML로 못 하는 것만 맡는다.
 *     1. 언어 제안 배너
 *     2. 광고 자리 채우기
 *
 * [설계 방향]
 *   헤더·푸터·언어 전환기는 여기서 그리지 않는다. scripts/gen-pages.mjs 가 정적 HTML로
 *   박아 넣는다. JS로 그리면 크롤러가 내부 링크를 못 보고 사용자는 깜빡임을 본다.
 *
 * [주의]
 *   생성된 HTML 에서 </body> 직전에 type="module" 로 불린다. 그래서 DOM 은 이미 준비돼 있고
 *   DOMContentLoaded 를 기다릴 필요가 없다.
 */
import { matchLocale, t } from './i18n/index.ts';
import { localeFromPath, switchLocalePath } from './site.ts';
import { readJson, writeJson } from './storage.ts';
import { mountAd } from './ads.ts';

/** 배너를 한 번 닫으면 다시 띄우지 않는다. */
const BANNER_DISMISSED = 'lang-banner-dismissed';

/**
 * 방문자의 브라우저 언어가 현재 페이지와 다르면 다른 언어판이 있다고 알린다.
 *
 * [왜 리다이렉트가 아니라 배너인가]
 *   브라우저 언어로 자동 이동시키면 구글 크롤러(주로 en)가 어떤 URL로 들어와도
 *   영어판만 보게 된다. 나머지 언어판은 색인되지 않고, 다국어를 한 의미가 사라진다.
 *   그래서 제안만 하고 이동은 사용자가 고르게 둔다.
 */
function setupLangBanner(): void {
  const current = localeFromPath(location.pathname);
  const preferred = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  const detected = matchLocale(preferred);

  if (detected === null || detected === current) return;
  if (readJson<boolean>(BANNER_DISMISSED, false)) return;

  const banner = document.createElement('div');
  banner.className = 'lang-banner';
  // 배너 내용은 방문자의 언어로 적는다. 못 읽는 언어로 안내하면 의미가 없다.
  banner.lang = detected;

  const message = document.createElement('span');
  message.textContent = t(detected, 'lang.suggest');

  const go = document.createElement('a');
  go.className = 'lang-banner__go';
  go.href = switchLocalePath(location.pathname, detected);
  go.hreflang = detected;
  go.textContent = t(detected, 'lang.goto');

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'lang-banner__dismiss';
  dismiss.textContent = t(detected, 'lang.dismiss');
  dismiss.addEventListener('click', () => {
    writeJson(BANNER_DISMISSED, true);
    banner.remove();
  });

  banner.append(message, go, dismiss);

  // 건너뛰기 링크 뒤, 헤더 앞. 접근성 순서를 흐트러뜨리지 않는 자리다.
  document.querySelector('.site-header')?.before(banner);
}

/**
 * HTML 에 박아둔 [data-ad-slot] 자리를 채운다.
 * ADSENSE_CLIENT 가 비어 있으면 mountAd 가 알아서 숨긴 채로 둔다.
 */
function setupAdSlots(): void {
  const slots = document.querySelectorAll<HTMLElement>('[data-ad-slot]');
  for (const element of slots) {
    const slot = element.dataset['adSlot'];
    if (slot) mountAd(element, slot);
  }
}

setupLangBanner();
setupAdSlots();
