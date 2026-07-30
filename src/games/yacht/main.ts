/**
 * [역할]
 *   야추 진입점. 상태를 들고 있으면서 엔진과 화면을 잇는다.
 *
 * [주의]
 *   - 실제 플레이는 Math.random 을 쓴다. rng.ts 의 시드 난수는 퍼즐 생성과 테스트용이고,
 *     사람이 하는 판까지 재현 가능하게 만들 이유가 없다.
 *   - 규칙은 여기 없다. 전부 engine.ts / scoring.ts 에 있다.
 *     여기서 점수를 계산하거나 조건을 검사하기 시작하면 규칙이 두 군데로 갈라진다.
 */
import './style.css';
import type { Category, GameState } from './types.ts';
import { choose, createGame, isFinished, roll, toggleHold } from './engine.ts';
import { totalScore } from './scoring.ts';
import { createView } from './ui.ts';
import { localeFromPath } from '../../shared/site.ts';
import { readJson, writeJson } from '../../shared/storage.ts';

const BEST_KEY = 'yacht:best';
const PLAYERS_KEY = 'yacht:players';

function loadPlayerCount(): number {
  return readJson<unknown>(PLAYERS_KEY, 1) === 2 ? 2 : 1;
}

function start(root: HTMLElement): void {
  const locale = localeFromPath(location.pathname);

  let playerCount = loadPlayerCount();
  let state: GameState = createGame(playerCount);
  let best = Number(readJson<unknown>(BEST_KEY, 0)) || 0;
  let newRecord = false;

  const update = (): void => {
    view.render(state, { best, newRecord });
  };

  /** 1인 모드에서 판이 끝났을 때만 최고 기록을 갱신한다. */
  const checkRecord = (): void => {
    if (state.players.length !== 1 || !isFinished(state)) return;
    const card = state.players[0]?.card;
    if (!card) return;
    const total = totalScore(card);
    if (total > best) {
      best = total;
      newRecord = true;
      writeJson(BEST_KEY, best);
    }
  };

  const restart = (count: number): void => {
    playerCount = count;
    state = createGame(count);
    newRecord = false;
    update();
  };

  const view = createView(root, locale, {
    onRoll() {
      state = roll(state, Math.random);
      update();
    },
    onToggleHold(index: number) {
      state = toggleHold(state, index);
      update();
    },
    onChoose(category: Category) {
      state = choose(state, category);
      checkRecord();
      update();
    },
    onNewGame() {
      restart(playerCount);
    },
    onPlayerCountChange(count: number) {
      if (count === playerCount) return;
      writeJson(PLAYERS_KEY, count);
      restart(count);
    },
  });

  update();
}

const container = document.getElementById('game');
if (container) start(container);
