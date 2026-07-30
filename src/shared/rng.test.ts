/**
 * [역할]
 *   시드 난수와 데일리 시드의 재현성 검증.
 *
 * [왜 이걸 테스트하나]
 *   '오늘의 퍼즐'은 **같은 시드가 항상 같은 결과를 낸다**는 성질 위에 서 있다.
 *   이게 깨지면 같은 날 접속한 두 사람이 다른 문제를 풀게 되는데,
 *   눈으로는 절대 못 잡는다. 여기서 못 박아 둔다.
 */
import { describe, expect, it } from 'vitest';
import { createRng, hashSeed, randomInt, shuffle } from './rng.ts';
import { dailySeed, todayKey } from './daily.ts';

describe('createRng', () => {
  it('같은 시드는 같은 수열을 낸다', () => {
    const a = createRng('sudoku-2026-07-31');
    const b = createRng('sudoku-2026-07-31');
    const take = (rng: () => number) => Array.from({ length: 8 }, rng);
    expect(take(a)).toEqual(take(b));
  });

  it('다른 시드는 다른 수열을 낸다', () => {
    const a = Array.from({ length: 8 }, createRng('seed-a'));
    const b = Array.from({ length: 8 }, createRng('seed-b'));
    expect(a).not.toEqual(b);
  });

  it('0 이상 1 미만을 낸다', () => {
    const rng = createRng(12345);
    for (let i = 0; i < 500; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('randomInt', () => {
  it('범위를 벗어나지 않는다', () => {
    const rng = createRng('range');
    for (let i = 0; i < 500; i++) {
      const value = randomInt(rng, 1, 7); // 주사위
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe('shuffle', () => {
  it('원본을 건드리지 않고 같은 원소를 돌려준다', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const result = shuffle(createRng('shuffle'), source);
    expect(source).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect([...result].sort((a, b) => a - b)).toEqual(source);
  });

  it('같은 시드면 같은 순서가 나온다', () => {
    const source = ['a', 'b', 'c', 'd', 'e'];
    expect(shuffle(createRng('same'), source)).toEqual(shuffle(createRng('same'), source));
  });
});

describe('hashSeed', () => {
  it('32비트 부호 없는 정수를 낸다', () => {
    const value = hashSeed('2026-07-31:sudoku');
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(0xffffffff);
  });
});

describe('dailySeed', () => {
  it('같은 날짜 · 같은 게임이면 같은 시드다', () => {
    expect(dailySeed('sudoku', '2026-07-31')).toBe(dailySeed('sudoku', '2026-07-31'));
  });

  it('날짜가 다르면 시드가 다르다', () => {
    expect(dailySeed('sudoku', '2026-07-31')).not.toBe(dailySeed('sudoku', '2026-08-01'));
  });

  it('같은 날이라도 게임이 다르면 시드가 다르다', () => {
    expect(dailySeed('sudoku', '2026-07-31')).not.toBe(dailySeed('minesweeper', '2026-07-31'));
  });
});

describe('todayKey', () => {
  it('로컬 기준 YYYY-MM-DD 를 만든다', () => {
    // 로컬 시간대의 2026-03-05 09:00. UTC 로 바꾸면 날짜가 밀릴 수 있는 시각이라
    // 로컬 기준으로 뽑는지 확인하는 데 쓸모가 있다.
    expect(todayKey(new Date(2026, 2, 5, 9, 0, 0))).toBe('2026-03-05');
  });

  it('한 자리 월·일에 0을 채운다', () => {
    expect(todayKey(new Date(2026, 0, 1, 12, 0, 0))).toBe('2026-01-01');
  });
});
