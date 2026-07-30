/**
 * [역할]
 *   시드를 줄 수 있는 난수 생성기. Math.random() 을 대체한다.
 *
 * [왜 필요한가]
 *   Math.random() 은 시드를 못 준다. 그래서 세 가지가 전부 불가능해진다.
 *     1. 오늘의 퍼즐 — 같은 날짜면 전 세계 누구나 같은 문제가 나와야 한다
 *     2. 퍼즐 재현 — 버그 난 판을 다시 만들어 봐야 디버깅이 된다
 *     3. 테스트 — 난수가 끼면 결과가 매번 달라 검증할 수 없다
 *
 * [구성 순서]
 *   1. 시드 만들기 (문자열 → 32비트 정수)
 *   2. 난수 생성기 (mulberry32)
 *   3. 자주 쓰는 도우미
 *
 * [주의]
 *   암호용이 아니다. 게임 판 생성 용도로만 쓴다.
 */

/** 0 이상 1 미만의 실수를 돌려주는 함수. Math.random 과 같은 모양이다. */
export type Rng = () => number;

// ══════════════════════════════════════════════════════════════
// 1. 시드 만들기
// ══════════════════════════════════════════════════════════════

/**
 * 문자열을 32비트 정수 시드로 바꾼다 (xmur3).
 * '2026-07-31:sudoku' 같은 키를 그대로 시드로 쓸 수 있게 해준다.
 */
export function hashSeed(text: string): number {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

// ══════════════════════════════════════════════════════════════
// 2. 난수 생성기
// ══════════════════════════════════════════════════════════════

/**
 * 시드로부터 난수 생성기를 만든다 (mulberry32).
 * 같은 시드는 언제 어디서 돌려도 같은 수열을 낸다 — 오늘의 퍼즐이 성립하는 근거다.
 */
export function createRng(seed: number | string): Rng {
  let a = typeof seed === 'string' ? hashSeed(seed) : seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ══════════════════════════════════════════════════════════════
// 3. 자주 쓰는 도우미
// ══════════════════════════════════════════════════════════════

/** min 이상 max 미만의 정수. */
export function randomInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min));
}

/** 배열에서 하나 고른다. 빈 배열이면 예외를 던진다. */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick: 빈 배열에서 고를 수 없다');
  return items[randomInt(rng, 0, items.length)] as T;
}

/** 피셔-예이츠 셔플. 원본은 건드리지 않고 새 배열을 돌려준다. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(rng, 0, i + 1);
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}
