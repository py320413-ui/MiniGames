/**
 * [역할]
 *   허브(게임 목록) 페이지의 <main> 안쪽 HTML을 만든다.
 *
 * [주의]
 *   - 카드를 JS로 그리지 않고 정적 HTML로 박는다. 크롤러가 게임 페이지로 가는
 *     내부 링크를 봐야 각 게임이 색인된다. 내부 링크는 SEO 자산이다.
 *   - status: 'soon' 인 게임은 링크가 아니라 '준비 중' 카드로 그린다.
 *     아직 없는 페이지로 링크가 걸리면 404 가 되고 색인 품질이 떨어진다.
 */
import { GAMES, gamePath } from './games.ts';
import { escapeHtml } from './html.ts';
import { sitePath, type Locale } from './site.ts';
import { t, type MessageKey } from './i18n/index.ts';
import type { GameMeta, GameMode } from './types.ts';

/** 모드 값 → 메시지 키. 모드를 추가하면 여기서 컴파일 에러가 나며 번역을 요구한다. */
const MODE_MESSAGE: Record<GameMode, MessageKey> = {
  solo: 'mode.solo',
  'local-2p': 'mode.local2p',
  'vs-ai': 'mode.vsAi',
  daily: 'mode.daily',
};

function renderModes(locale: Locale, modes: GameMode[]): string {
  if (modes.length === 0) return '';
  const items = modes
    .map((mode) => `<li class="card__mode">${escapeHtml(t(locale, MODE_MESSAGE[mode]))}</li>`)
    .join('');
  return `<ul class="card__modes">${items}</ul>`;
}

function renderCard(locale: Locale, game: GameMeta): string {
  const text = game.i18n[locale];
  const inner = `<span class="card__emoji" aria-hidden="true">${game.emoji}</span>
          <h2 class="card__title">${escapeHtml(text.title)}</h2>
          <p class="card__desc">${escapeHtml(text.description)}</p>
          ${renderModes(locale, game.modes)}`;

  if (game.status === 'live') {
    return `        <a class="card" href="${escapeHtml(sitePath(locale, gamePath(game.slug)))}">
          ${inner}
          <span class="card__cta">${escapeHtml(t(locale, 'hub.play'))}</span>
        </a>`;
  }

  return `        <article class="card card--soon">
          ${inner}
          <span class="card__badge">${escapeHtml(t(locale, 'hub.comingSoon'))}</span>
        </article>`;
}

/** 허브 본문. 로케일별로 한 번씩 호출된다. */
export function renderHubMain(locale: Locale): string {
  const cards = GAMES.map((game) => renderCard(locale, game)).join('\n');
  return `      <h1 class="page-title">${escapeHtml(t(locale, 'hub.heading'))}</h1>
      <p class="page-intro">${escapeHtml(t(locale, 'hub.intro'))}</p>
      <div class="card-grid">
${cards}
      </div>`;
}
