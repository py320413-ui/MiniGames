/**
 * [역할]
 *   족보 판정과 점수 계산. 전부 순수 함수다 — DOM 도 언어도 상태도 모른다.
 *
 * [구성 순서]
 *   1. 상수와 목록
 *   2. 주사위 분석 도우미
 *   3. 족보별 점수
 *   4. 점수표 합계
 *
 * [채택한 규칙 — 한국식 야추다이스]
 *   미국식 Yahtzee 와 다른 부분이 있어서 못 박아 둔다.
 *     - 포카드 · 풀하우스는 **주사위 5개의 합**이다 (Yahtzee 의 25점 고정이 아니다).
 *     - 5개가 모두 같으면 풀하우스로도 인정한다 (3개 + 2개로 본다).
 *     - S.스트레이트 15점, L.스트레이트 30점, 야추 50점 고정.
 *     - 윗칸 소계가 63점 이상이면 보너스 35점.
 *
 * [주의]
 *   한 주사위 조합이 여러 족보에 동시에 해당될 수 있다.
 *   [3,3,3,3,3] 은 야추이면서 포카드이고 풀하우스이기도 하다.
 *   scoring.test.ts 에서 이런 경계를 못 박아 뒀으니 규칙을 손대면 거기부터 볼 것.
 */
import type { Category, Dice, DieValue, LowerCategory, ScoreCard, UpperCategory } from './types.ts';

// ══════════════════════════════════════════════════════════════
// 1. 상수와 목록
// ══════════════════════════════════════════════════════════════

export const DICE_COUNT = 5;
export const MAX_ROLLS = 3;

export const UPPER_BONUS_THRESHOLD = 63;
export const UPPER_BONUS = 35;

export const SMALL_STRAIGHT_SCORE = 15;
export const LARGE_STRAIGHT_SCORE = 30;
export const YACHT_SCORE = 50;

/** 점수표에 보이는 순서 그대로. */
export const UPPER_CATEGORIES: readonly UpperCategory[] = [
  'aces',
  'deuces',
  'threes',
  'fours',
  'fives',
  'sixes',
];

export const LOWER_CATEGORIES: readonly LowerCategory[] = [
  'choice',
  'fourOfAKind',
  'fullHouse',
  'smallStraight',
  'largeStraight',
  'yacht',
];

export const CATEGORIES: readonly Category[] = [...UPPER_CATEGORIES, ...LOWER_CATEGORIES];

/** 총 라운드 수 = 채워야 하는 칸 수. */
export const TOTAL_ROUNDS = CATEGORIES.length;

/** 윗칸 족보 → 세어야 할 눈. */
const UPPER_FACE: Record<UpperCategory, DieValue> = {
  aces: 1,
  deuces: 2,
  threes: 3,
  fours: 4,
  fives: 5,
  sixes: 6,
};

// ══════════════════════════════════════════════════════════════
// 2. 주사위 분석 도우미
// ══════════════════════════════════════════════════════════════

/** 눈별 개수. Record 라서 undefined 가 나오지 않는다. */
function countByFace(dice: Dice): Record<DieValue, number> {
  const counts: Record<DieValue, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const die of dice) counts[die] += 1;
  return counts;
}

/** 주사위 눈의 총합. */
export function diceSum(dice: Dice): number {
  return dice.reduce((total, die) => total + die, 0);
}

/** 같은 눈이 n개 이상 있는가. */
function hasNOfAKind(dice: Dice, n: number): boolean {
  return Object.values(countByFace(dice)).some((count) => count >= n);
}

/**
 * 풀하우스인가. 3개 + 2개, 또는 5개 모두 같은 경우.
 * 5개가 같은 걸 인정하는 건 한국식 관례다 — 미국식 Yahtzee 기본 규칙과 다르다.
 */
function isFullHouse(dice: Dice): boolean {
  const groups = Object.values(countByFace(dice))
    .filter((count) => count > 0)
    .sort((a, b) => b - a);
  return groups[0] === 5 || (groups[0] === 3 && groups[1] === 2);
}

/** 연속한 눈이 length 개 이상 있는가. 중복은 무시한다. */
function hasStraight(dice: Dice, length: number): boolean {
  const counts = countByFace(dice);
  let run = 0;
  for (let face = 1 as DieValue; face <= 6; face = (face + 1) as DieValue) {
    run = counts[face] > 0 ? run + 1 : 0;
    if (run >= length) return true;
  }
  return false;
}

// ══════════════════════════════════════════════════════════════
// 3. 족보별 점수
// ══════════════════════════════════════════════════════════════

/**
 * 이 주사위를 이 칸에 넣으면 몇 점인가.
 * 조건에 맞지 않으면 0점이다 — 넣을 수 없는 게 아니라 0점으로 채워진다.
 */
export function scoreFor(category: Category, dice: Dice): number {
  switch (category) {
    case 'aces':
    case 'deuces':
    case 'threes':
    case 'fours':
    case 'fives':
    case 'sixes': {
      const face = UPPER_FACE[category];
      return countByFace(dice)[face] * face;
    }
    case 'choice':
      return diceSum(dice);
    case 'fourOfAKind':
      return hasNOfAKind(dice, 4) ? diceSum(dice) : 0;
    case 'fullHouse':
      return isFullHouse(dice) ? diceSum(dice) : 0;
    case 'smallStraight':
      return hasStraight(dice, 4) ? SMALL_STRAIGHT_SCORE : 0;
    case 'largeStraight':
      return hasStraight(dice, 5) ? LARGE_STRAIGHT_SCORE : 0;
    case 'yacht':
      return hasNOfAKind(dice, DICE_COUNT) ? YACHT_SCORE : 0;
  }
}

// ══════════════════════════════════════════════════════════════
// 4. 점수표 합계
// ══════════════════════════════════════════════════════════════

/** 빈 점수표. */
export function createEmptyCard(): ScoreCard {
  const card = {} as Record<Category, number | null>;
  for (const category of CATEGORIES) card[category] = null;
  return card;
}

/** 윗칸 소계. 보너스 판정의 기준이다. */
export function upperSubtotal(card: ScoreCard): number {
  return UPPER_CATEGORIES.reduce((total, category) => total + (card[category] ?? 0), 0);
}

/** 윗칸 보너스. 63점 이상이면 35점. */
export function upperBonus(card: ScoreCard): number {
  return upperSubtotal(card) >= UPPER_BONUS_THRESHOLD ? UPPER_BONUS : 0;
}

/** 최종 점수 = 윗칸 + 보너스 + 아랫칸. */
export function totalScore(card: ScoreCard): number {
  const lower = LOWER_CATEGORIES.reduce((total, category) => total + (card[category] ?? 0), 0);
  return upperSubtotal(card) + upperBonus(card) + lower;
}

/** 아직 안 채운 칸 목록. */
export function openCategories(card: ScoreCard): readonly Category[] {
  return CATEGORIES.filter((category) => card[category] === null);
}

/** 12칸을 다 채웠는가. */
export function isCardComplete(card: ScoreCard): boolean {
  return openCategories(card).length === 0;
}

/**
 * 보너스까지 몇 점 남았는가. 이미 받았으면 0.
 * 윗칸에 얼마나 더 넣어야 하는지 보여주는 데 쓴다 — 초보자에게 가장 헷갈리는 부분이다.
 */
export function bonusRemaining(card: ScoreCard): number {
  return Math.max(0, UPPER_BONUS_THRESHOLD - upperSubtotal(card));
}
