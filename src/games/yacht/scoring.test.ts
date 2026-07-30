/**
 * [역할]
 *   족보 판정과 점수 계산 검증.
 *
 * [왜 여기부터 테스트를 쓰나]
 *   한 조합이 여러 족보에 동시에 해당되는 경우가 많은데, 손으로 눌러보면서는
 *   절대 다 확인하지 못한다. [3,3,3,3,3] 하나만 해도 야추·포카드·풀하우스
 *   세 칸을 동시에 만족한다. 규칙을 손대면 여기가 먼저 깨져야 한다.
 */
import { describe, expect, it } from 'vitest';
import type { Category, Dice, ScoreCard } from './types.ts';
import {
  CATEGORIES,
  UPPER_BONUS,
  UPPER_BONUS_THRESHOLD,
  bonusRemaining,
  createEmptyCard,
  diceSum,
  isCardComplete,
  openCategories,
  scoreFor,
  totalScore,
  upperBonus,
  upperSubtotal,
} from './scoring.ts';

/** 테스트를 읽기 쉽게 하는 도우미. */
const d = (...values: number[]): Dice => values as Dice;
const fill = (entries: Partial<Record<Category, number>>): ScoreCard => ({
  ...createEmptyCard(),
  ...entries,
});

describe('윗칸 — 해당 눈의 합', () => {
  it('그 눈이 있는 만큼만 더한다', () => {
    expect(scoreFor('aces', d(1, 1, 3, 4, 5))).toBe(2);
    expect(scoreFor('threes', d(3, 3, 3, 4, 5))).toBe(9);
    expect(scoreFor('sixes', d(6, 6, 6, 6, 6))).toBe(30);
  });

  it('그 눈이 하나도 없으면 0점이다', () => {
    expect(scoreFor('deuces', d(1, 3, 4, 5, 6))).toBe(0);
  });
});

describe('초이스', () => {
  it('주사위 5개의 합이다', () => {
    expect(scoreFor('choice', d(1, 2, 3, 4, 5))).toBe(15);
    expect(scoreFor('choice', d(6, 6, 6, 6, 6))).toBe(30);
  });
});

describe('포카드', () => {
  it('같은 눈 4개면 주사위 전체 합이다', () => {
    // 25점 고정이 아니라 합이다. 미국식 Yahtzee 와 다른 부분.
    expect(scoreFor('fourOfAKind', d(4, 4, 4, 4, 2))).toBe(18);
  });

  it('5개가 같아도 포카드로 인정한다', () => {
    expect(scoreFor('fourOfAKind', d(3, 3, 3, 3, 3))).toBe(15);
  });

  it('3개까지는 0점이다', () => {
    expect(scoreFor('fourOfAKind', d(4, 4, 4, 2, 2))).toBe(0);
  });
});

describe('풀하우스', () => {
  it('3개 + 2개면 주사위 전체 합이다', () => {
    expect(scoreFor('fullHouse', d(4, 4, 4, 2, 2))).toBe(16);
  });

  it('5개가 모두 같아도 풀하우스로 인정한다 (한국식 관례)', () => {
    expect(scoreFor('fullHouse', d(3, 3, 3, 3, 3))).toBe(15);
  });

  it('4개 + 1개는 풀하우스가 아니다', () => {
    expect(scoreFor('fullHouse', d(5, 5, 5, 5, 2))).toBe(0);
  });

  it('2개 + 2개 + 1개는 풀하우스가 아니다', () => {
    expect(scoreFor('fullHouse', d(5, 5, 3, 3, 2))).toBe(0);
  });
});

describe('스트레이트', () => {
  it('연속 4개면 S.스트레이트 15점', () => {
    expect(scoreFor('smallStraight', d(1, 2, 3, 4, 6))).toBe(15);
    expect(scoreFor('smallStraight', d(2, 3, 4, 5, 5))).toBe(15);
    expect(scoreFor('smallStraight', d(3, 4, 5, 6, 1))).toBe(15);
  });

  it('중복이 섞여도 연속만 있으면 인정한다', () => {
    expect(scoreFor('smallStraight', d(2, 2, 3, 4, 5))).toBe(15);
  });

  it('연속이 3개까지면 0점이다', () => {
    expect(scoreFor('smallStraight', d(1, 2, 3, 5, 6))).toBe(0);
  });

  it('연속 5개면 L.스트레이트 30점', () => {
    expect(scoreFor('largeStraight', d(1, 2, 3, 4, 5))).toBe(30);
    expect(scoreFor('largeStraight', d(2, 3, 4, 5, 6))).toBe(30);
  });

  it('L.스트레이트는 1~6 을 건너뛰면 안 된다', () => {
    expect(scoreFor('largeStraight', d(1, 2, 3, 4, 6))).toBe(0);
  });

  it('L.스트레이트면 S.스트레이트도 성립한다', () => {
    expect(scoreFor('smallStraight', d(1, 2, 3, 4, 5))).toBe(15);
  });
});

describe('야추', () => {
  it('5개가 모두 같으면 50점', () => {
    expect(scoreFor('yacht', d(2, 2, 2, 2, 2))).toBe(50);
  });

  it('4개까지는 0점이다', () => {
    expect(scoreFor('yacht', d(2, 2, 2, 2, 5))).toBe(0);
  });
});

describe('겹치는 족보 — [3,3,3,3,3]', () => {
  it('야추이면서 포카드이고 풀하우스다', () => {
    const dice = d(3, 3, 3, 3, 3);
    expect(scoreFor('yacht', dice)).toBe(50);
    expect(scoreFor('fourOfAKind', dice)).toBe(15);
    expect(scoreFor('fullHouse', dice)).toBe(15);
    expect(scoreFor('choice', dice)).toBe(15);
    expect(scoreFor('threes', dice)).toBe(15);
    // 스트레이트는 아니다.
    expect(scoreFor('smallStraight', dice)).toBe(0);
    expect(scoreFor('largeStraight', dice)).toBe(0);
  });
});

describe('diceSum', () => {
  it('눈을 전부 더한다', () => {
    expect(diceSum(d(1, 2, 3, 4, 5))).toBe(15);
  });
});

describe('윗칸 보너스', () => {
  it('63점 이상이면 35점을 준다', () => {
    // 1×3 + 2×3 + 3×3 + 4×3 + 5×3 + 6×3 = 63
    const card = fill({ aces: 3, deuces: 6, threes: 9, fours: 12, fives: 15, sixes: 18 });
    expect(upperSubtotal(card)).toBe(UPPER_BONUS_THRESHOLD);
    expect(upperBonus(card)).toBe(UPPER_BONUS);
  });

  it('62점이면 보너스가 없다', () => {
    const card = fill({ aces: 2, deuces: 6, threes: 9, fours: 12, fives: 15, sixes: 18 });
    expect(upperSubtotal(card)).toBe(62);
    expect(upperBonus(card)).toBe(0);
  });

  it('아직 안 채운 칸은 0으로 본다', () => {
    expect(upperSubtotal(fill({ aces: 3 }))).toBe(3);
    expect(upperBonus(createEmptyCard())).toBe(0);
  });

  it('보너스까지 남은 점수를 알려준다', () => {
    expect(bonusRemaining(createEmptyCard())).toBe(UPPER_BONUS_THRESHOLD);
    expect(bonusRemaining(fill({ sixes: 18, fives: 15 }))).toBe(30);
    // 이미 넘겼으면 0
    expect(bonusRemaining(fill({ aces: 3, deuces: 6, threes: 9, fours: 12, fives: 15, sixes: 18 }))).toBe(0);
  });
});

describe('합계', () => {
  it('윗칸 + 보너스 + 아랫칸을 더한다', () => {
    const card = fill({
      aces: 3,
      deuces: 6,
      threes: 9,
      fours: 12,
      fives: 15,
      sixes: 18, // 소계 63 → 보너스 35
      choice: 20,
      yacht: 50,
    });
    expect(totalScore(card)).toBe(63 + 35 + 20 + 50);
  });

  it('0점으로 채운 칸도 채운 것으로 센다', () => {
    // null 과 0 을 구별하지 못하면 여기서 깨진다.
    const card = fill({ yacht: 0 });
    expect(card.yacht).toBe(0);
    expect(openCategories(card)).not.toContain('yacht');
    expect(totalScore(card)).toBe(0);
  });
});

describe('점수표 상태', () => {
  it('빈 점수표는 12칸이 모두 비어 있다', () => {
    const card = createEmptyCard();
    expect(openCategories(card)).toHaveLength(12);
    expect(isCardComplete(card)).toBe(false);
  });

  it('12칸을 다 채우면 완료다', () => {
    const entries = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    expect(isCardComplete(fill(entries))).toBe(true);
  });
});
