/**
 * [역할]
 *   게임 진행 규칙. 굴리기·홀드·칸 확정·턴 넘김을 담당한다.
 *
 * [구성 순서]
 *   1. 선택자 (상태에서 파생되는 값)
 *   2. 게임 시작
 *   3. 상태 전이
 *
 * [설계 방향]
 *   전부 순수 함수다. 상태를 고치지 않고 새 상태를 돌려준다.
 *   난수도 인자로 받는다 — 그래야 테스트에서 주사위를 고정할 수 있다.
 *   DOM 도 언어도 모른다. 그리는 건 ui.ts, 문구는 i18n.ts 담당이다.
 *
 * [주의]
 *   잘못된 조작은 예외를 던지지 않고 **상태를 그대로 돌려준다**.
 *   UI 가 버튼을 잠그는 것으로 1차 방어를 하지만, 연타나 경합으로 새는 경우가 있다.
 *   그때 게임이 죽는 것보다 아무 일도 안 일어나는 쪽이 낫다.
 */
import type { Category, Dice, DieValue, GameState, Holds, PlayerState } from './types.ts';
import {
  DICE_COUNT,
  MAX_ROLLS,
  TOTAL_ROUNDS,
  createEmptyCard,
  isCardComplete,
  scoreFor,
} from './scoring.ts';
import type { Rng } from '../../shared/rng.ts';
import { randomInt } from '../../shared/rng.ts';

// ══════════════════════════════════════════════════════════════
// 1. 선택자
// ══════════════════════════════════════════════════════════════

/** 이번 턴에 한 번이라도 굴렸는가. 안 굴렸으면 점수를 넣을 수 없다. */
export function hasRolled(state: GameState): boolean {
  return state.rollsLeft < MAX_ROLLS;
}

/** 모든 플레이어가 12칸을 다 채웠는가. */
export function isFinished(state: GameState): boolean {
  return state.players.every((player) => isCardComplete(player.card));
}

/** 지금 차례인 플레이어. */
export function currentPlayer(state: GameState): PlayerState {
  return state.players[state.current] ?? { card: createEmptyCard() };
}

/** 지금 플레이어가 진행 중인 라운드 (1부터 TOTAL_ROUNDS 까지). */
export function currentRound(state: GameState): number {
  const filled = Object.values(currentPlayer(state).card).filter((value) => value !== null).length;
  return Math.min(filled + 1, TOTAL_ROUNDS);
}

export function canRoll(state: GameState): boolean {
  return !isFinished(state) && state.rollsLeft > 0;
}

/** 굴린 뒤에만 점수를 넣을 수 있다. */
export function canChoose(state: GameState, category: Category): boolean {
  return !isFinished(state) && hasRolled(state) && currentPlayer(state).card[category] === null;
}

/** 홀드는 굴린 뒤부터, 그리고 다시 굴릴 기회가 남아 있을 때만 의미가 있다. */
export function canHold(state: GameState): boolean {
  return !isFinished(state) && hasRolled(state) && state.rollsLeft > 0;
}

/**
 * 지금 주사위로 각 칸에 넣으면 몇 점인지.
 * 이미 채운 칸은 제외한다. "어디에 넣을까"를 고르는 데 필요한 정보다.
 */
export function previewScores(state: GameState): Partial<Record<Category, number>> {
  if (!hasRolled(state)) return {};
  const card = currentPlayer(state).card;
  const preview: Partial<Record<Category, number>> = {};
  for (const category of Object.keys(card) as Category[]) {
    if (card[category] === null) preview[category] = scoreFor(category, state.dice);
  }
  return preview;
}

// ══════════════════════════════════════════════════════════════
// 2. 게임 시작
// ══════════════════════════════════════════════════════════════

function rollDie(rng: Rng): DieValue {
  return randomInt(rng, 1, 7) as DieValue;
}

/** 아직 안 굴린 상태의 주사위. 화면에 뭐라도 보여주려고 1~5 로 둔다. */
function initialDice(): Dice {
  return [1, 2, 3, 4, 5];
}

function noHolds(): Holds {
  return Array.from({ length: DICE_COUNT }, () => false);
}

export function createGame(playerCount: number): GameState {
  return {
    players: Array.from({ length: Math.max(1, playerCount) }, () => ({ card: createEmptyCard() })),
    current: 0,
    dice: initialDice(),
    held: noHolds(),
    rollsLeft: MAX_ROLLS,
  };
}

// ══════════════════════════════════════════════════════════════
// 3. 상태 전이
// ══════════════════════════════════════════════════════════════

/** 고정하지 않은 주사위만 다시 굴린다. */
export function roll(state: GameState, rng: Rng): GameState {
  if (!canRoll(state)) return state;
  return {
    ...state,
    dice: state.dice.map((die, index) => (state.held[index] === true ? die : rollDie(rng))),
    rollsLeft: state.rollsLeft - 1,
  };
}

/** 주사위 하나의 고정을 켜고 끈다. */
export function toggleHold(state: GameState, index: number): GameState {
  if (!canHold(state)) return state;
  if (index < 0 || index >= DICE_COUNT) return state;
  return {
    ...state,
    held: state.held.map((value, i) => (i === index ? !value : value)),
  };
}

/**
 * 점수를 칸에 확정하고 다음 턴으로 넘긴다.
 * 조건에 안 맞는 주사위여도 0점으로 채워진다 — 버릴 칸을 고르는 것도 전략이다.
 */
export function choose(state: GameState, category: Category): GameState {
  if (!canChoose(state, category)) return state;

  const score = scoreFor(category, state.dice);
  const players = state.players.map((player, index) =>
    index === state.current ? { card: { ...player.card, [category]: score } } : player,
  );

  const next: GameState = { ...state, players };
  if (isFinished(next)) {
    // 끝났으면 마지막 주사위를 그대로 남겨 둔다. 결과 화면에서 보여주기 위해서다.
    return next;
  }

  return {
    ...next,
    current: nextPlayerIndex(next),
    dice: initialDice(),
    held: noHolds(),
    rollsLeft: MAX_ROLLS,
  };
}

/** 아직 칸이 남은 다음 플레이어를 찾는다. */
function nextPlayerIndex(state: GameState): number {
  const count = state.players.length;
  for (let step = 1; step <= count; step++) {
    const index = (state.current + step) % count;
    const player = state.players[index];
    if (player && !isCardComplete(player.card)) return index;
  }
  return state.current;
}

/**
 * 최고점과 그 점수를 낸 플레이어들.
 * 동점이면 winners 가 여러 명이 된다 — 무승부 표시에 쓴다.
 */
export function results(totals: readonly number[]): {
  readonly winners: readonly number[];
  readonly best: number;
} {
  const best = totals.reduce((max, value) => Math.max(max, value), 0);
  const winners = totals.flatMap((value, index) => (value === best ? [index] : []));
  return { winners, best };
}
