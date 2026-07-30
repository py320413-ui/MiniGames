/**
 * [역할]
 *   게임 진행 규칙 검증 — 굴림 횟수 제한, 홀드, 칸 확정, 턴 넘김, 종료 판정.
 *
 * [주의]
 *   난수를 인자로 받게 만들어 뒀으니 주사위를 원하는 값으로 고정할 수 있다.
 *   Math.random() 을 썼다면 이 파일 전체를 쓸 수 없었다.
 */
import { describe, expect, it } from 'vitest';
import type { DieValue, GameState } from './types.ts';
import {
  canChoose,
  canHold,
  canRoll,
  choose,
  createGame,
  currentPlayer,
  currentRound,
  hasRolled,
  isFinished,
  previewScores,
  results,
  roll,
  toggleHold,
} from './engine.ts';
import { CATEGORIES, MAX_ROLLS, totalScore } from './scoring.ts';

/** 항상 같은 눈만 내는 가짜 난수기. randomInt(rng, 1, 7) 이 원하는 값이 되게 맞춘다. */
const always = (value: DieValue) => () => (value - 1) / 6 + 0.0001;

/** 눈을 순서대로 흘려보내는 가짜 난수기. */
function sequence(values: readonly DieValue[]) {
  let index = 0;
  return () => {
    const value = values[index % values.length] ?? 1;
    index += 1;
    return (value - 1) / 6 + 0.0001;
  };
}

/** 12칸을 전부 채워 게임을 끝낸다. */
function playToEnd(state: GameState): GameState {
  let current = state;
  let guard = 0;
  while (!isFinished(current) && guard < 100) {
    current = roll(current, always(1));
    const open = CATEGORIES.find((category) => canChoose(current, category));
    if (!open) break;
    current = choose(current, open);
    guard += 1;
  }
  return current;
}

describe('createGame', () => {
  it('빈 점수표로 시작하고 아직 굴리지 않은 상태다', () => {
    const state = createGame(1);
    expect(state.players).toHaveLength(1);
    expect(state.rollsLeft).toBe(MAX_ROLLS);
    expect(hasRolled(state)).toBe(false);
    expect(currentRound(state)).toBe(1);
    expect(isFinished(state)).toBe(false);
  });

  it('2인 게임은 플레이어가 둘이다', () => {
    expect(createGame(2).players).toHaveLength(2);
  });
});

describe('굴리기', () => {
  it('굴리면 남은 횟수가 하나 준다', () => {
    const state = roll(createGame(1), always(4));
    expect(state.rollsLeft).toBe(MAX_ROLLS - 1);
    expect(state.dice).toEqual([4, 4, 4, 4, 4]);
    expect(hasRolled(state)).toBe(true);
  });

  it('한 턴에 3번까지만 굴릴 수 있다', () => {
    let state = createGame(1);
    for (let i = 0; i < MAX_ROLLS; i++) state = roll(state, always(2));
    expect(state.rollsLeft).toBe(0);
    expect(canRoll(state)).toBe(false);

    // 4번째 굴림은 아무 일도 일어나지 않는다 (예외를 던지지 않는다)
    const after = roll(state, always(6));
    expect(after).toBe(state);
  });
});

describe('홀드', () => {
  it('고정한 주사위는 다시 굴려도 그대로다', () => {
    let state = roll(createGame(1), always(6)); // [6,6,6,6,6]
    state = toggleHold(state, 0);
    state = toggleHold(state, 1);
    state = roll(state, always(1));
    expect(state.dice).toEqual([6, 6, 1, 1, 1]);
  });

  it('굴리기 전에는 고정할 수 없다', () => {
    const state = createGame(1);
    expect(canHold(state)).toBe(false);
    expect(toggleHold(state, 0)).toBe(state);
  });

  it('마지막 굴림을 끝내면 고정이 의미가 없어진다', () => {
    let state = createGame(1);
    for (let i = 0; i < MAX_ROLLS; i++) state = roll(state, always(3));
    expect(canHold(state)).toBe(false);
  });

  it('다시 누르면 고정이 풀린다', () => {
    let state = roll(createGame(1), always(5));
    state = toggleHold(state, 2);
    expect(state.held[2]).toBe(true);
    state = toggleHold(state, 2);
    expect(state.held[2]).toBe(false);
  });

  it('범위 밖 인덱스는 무시한다', () => {
    const state = roll(createGame(1), always(5));
    expect(toggleHold(state, 9)).toBe(state);
    expect(toggleHold(state, -1)).toBe(state);
  });
});

describe('칸 확정', () => {
  it('굴리기 전에는 점수를 넣을 수 없다', () => {
    const state = createGame(1);
    expect(canChoose(state, 'choice')).toBe(false);
    expect(choose(state, 'choice')).toBe(state);
  });

  it('점수가 들어가고 다음 턴이 초기화된다', () => {
    let state = roll(createGame(1), always(6)); // [6,6,6,6,6]
    state = choose(state, 'sixes');
    expect(currentPlayer(state).card.sixes).toBe(30);
    expect(state.rollsLeft).toBe(MAX_ROLLS);
    expect(state.held).toEqual([false, false, false, false, false]);
    expect(currentRound(state)).toBe(2);
  });

  it('이미 채운 칸은 다시 못 넣는다', () => {
    let state = roll(createGame(1), always(6));
    state = choose(state, 'sixes');
    const before = state;
    state = roll(state, always(6));
    expect(canChoose(state, 'sixes')).toBe(false);
    expect(choose(state, 'sixes')).toBe(state);
    expect(currentPlayer(before).card.sixes).toBe(30);
  });

  it('조건에 안 맞아도 0점으로 채워진다 — 칸을 버리는 것도 전략이다', () => {
    let state = roll(createGame(1), always(2)); // [2,2,2,2,2]
    state = choose(state, 'largeStraight');
    expect(currentPlayer(state).card.largeStraight).toBe(0);
    // null 이 아니라 0 이어야 한다. 채운 칸으로 세야 하기 때문이다.
    expect(currentPlayer(state).card.largeStraight).not.toBeNull();
  });
});

describe('턴 넘김 (2인)', () => {
  it('점수를 넣으면 상대에게 넘어간다', () => {
    let state = roll(createGame(2), always(4));
    expect(state.current).toBe(0);
    state = choose(state, 'fours');
    expect(state.current).toBe(1);
    expect(hasRolled(state)).toBe(false);
  });

  it('상대 점수표는 건드리지 않는다', () => {
    let state = roll(createGame(2), always(4));
    state = choose(state, 'fours');
    expect(state.players[0]?.card.fours).toBe(20);
    expect(state.players[1]?.card.fours).toBeNull();
  });

  it('한 바퀴 돌면 다시 첫 플레이어 차례다', () => {
    let state = roll(createGame(2), always(4));
    state = choose(state, 'fours');
    state = roll(state, always(3));
    state = choose(state, 'threes');
    expect(state.current).toBe(0);
  });
});

describe('미리보기', () => {
  it('굴리기 전에는 비어 있다', () => {
    expect(previewScores(createGame(1))).toEqual({});
  });

  it('안 채운 칸의 예상 점수를 알려준다', () => {
    const state = roll(createGame(1), sequence([1, 2, 3, 4, 5]));
    const preview = previewScores(state);
    expect(preview.largeStraight).toBe(30);
    expect(preview.choice).toBe(15);
    expect(preview.yacht).toBe(0);
  });

  it('이미 채운 칸은 빠진다', () => {
    let state = roll(createGame(1), always(6));
    state = choose(state, 'sixes');
    state = roll(state, always(6));
    expect(previewScores(state).sixes).toBeUndefined();
    expect(previewScores(state).yacht).toBe(50);
  });
});

describe('게임 종료', () => {
  it('12칸을 다 채우면 끝난다', () => {
    const state = playToEnd(createGame(1));
    expect(isFinished(state)).toBe(true);
    expect(currentRound(state)).toBe(12);
    expect(canRoll(state)).toBe(false);
  });

  it('2인은 둘 다 채워야 끝난다', () => {
    const state = playToEnd(createGame(2));
    expect(isFinished(state)).toBe(true);
    expect(state.players.every((p) => Object.values(p.card).every((v) => v !== null))).toBe(true);
  });

  it('끝난 뒤에는 아무 조작도 안 먹는다', () => {
    const state = playToEnd(createGame(1));
    expect(roll(state, always(6))).toBe(state);
    expect(choose(state, 'yacht')).toBe(state);
  });
});

describe('results', () => {
  it('최고점과 그 사람을 찾는다', () => {
    expect(results([120, 95])).toEqual({ winners: [0], best: 120 });
    expect(results([80, 140])).toEqual({ winners: [1], best: 140 });
  });

  it('동점이면 둘 다 승자다', () => {
    expect(results([100, 100])).toEqual({ winners: [0, 1], best: 100 });
  });

  it('실제 게임 결과와 이어진다', () => {
    const state = playToEnd(createGame(2));
    const totals = state.players.map((player) => totalScore(player.card));
    const { winners, best } = results(totals);
    expect(winners.length).toBeGreaterThan(0);
    expect(totals[winners[0] ?? 0]).toBe(best);
  });
});
