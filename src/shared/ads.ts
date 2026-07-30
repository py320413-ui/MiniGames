/**
 * [역할]
 *   AdSense 광고 슬롯을 한 곳에서 관리한다.
 *
 * [지금 상태]
 *   ADSENSE_CLIENT 가 비어 있다. 그래서 mountAd() 는 아무것도 그리지 않는다.
 *   승인 전까지 사이트는 광고 없이 깨끗하게 뜨고, 승인되면 아래 한 줄만 채우면
 *   전 페이지·전 언어에 광고가 들어간다.
 *
 * [신청 시점]
 *   게임 1~2개짜리 사이트는 AdSense 심사를 통과하지 못한다.
 *   게임 4개 + 언어별 규칙 설명 본문이 쌓인 뒤에 신청한다.
 *
 * [배치 규칙 — 계정 정지를 피하려면 반드시 지킬 것]
 *   광고를 주사위·스도쿠 격자·버튼 같은 조작 영역 근처나 바로 위에 두지 않는다.
 *   실수 클릭을 유도하는 배치는 AdSense 정책 위반이고, 경고 없이 계정이 정지될 수 있다.
 *   광고는 게임 영역 '아래' 설명 문단 사이와 데스크톱 사이드바에만 둔다.
 */

/** 승인 후 'ca-pub-0000000000000000' 형태로 채운다. 비밀값이 아니다 — 어차피 페이지 소스에 노출된다. */
export const ADSENSE_CLIENT = '';

/** 광고를 실제로 내보낼 수 있는 상태인지. */
export function adsEnabled(): boolean {
  return ADSENSE_CLIENT !== '';
}

/**
 * AdSense 로더 스크립트를 한 번만 붙인다.
 * 광고가 하나도 없는 페이지에서는 호출되지 않으므로 불필요한 요청이 생기지 않는다.
 */
function ensureLoader(): void {
  const id = 'adsense-loader';
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(script);
}

/**
 * 컨테이너 안에 광고 슬롯을 만든다.
 * ADSENSE_CLIENT 가 비어 있으면 컨테이너를 숨기고 끝낸다 — 빈 자리가 남지 않는다.
 *
 * @param container 광고가 들어갈 요소
 * @param slot      AdSense 에서 발급받은 광고 단위 ID
 */
export function mountAd(container: HTMLElement, slot: string): void {
  if (!adsEnabled()) {
    container.hidden = true;
    return;
  }

  container.hidden = false;
  ensureLoader();

  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.display = 'block';
  ins.dataset['adClient'] = ADSENSE_CLIENT;
  ins.dataset['adSlot'] = slot;
  ins.dataset['adFormat'] = 'auto';
  ins.dataset['fullWidthResponsive'] = 'true';
  container.appendChild(ins);

  // AdSense 는 전역 배열에 push 하면 슬롯을 채운다.
  const w = window as unknown as { adsbygoogle?: unknown[] };
  w.adsbygoogle = w.adsbygoogle ?? [];
  w.adsbygoogle.push({});
}
