/**
 * [역할]
 *   날짜를 시드로 바꿔 '오늘의 퍼즐'을 만든다. 서버 없이 데일리 콘텐츠를 굴리는 핵심.
 *
 * [설계 방향]
 *   날짜 기준을 UTC 가 아니라 '사용자의 로컬 날짜'로 잡았다.
 *   UTC 로 하면 한국 사용자는 오전 9시에 문제가 바뀐다 — '오늘의 퍼즐'이라는 말과 어긋난다.
 *   로컬 기준이면 각자 자정에 새 문제를 받고, 같은 날짜끼리는 여전히 같은 문제다.
 *
 * [주의]
 *   시드에 게임 슬러그를 섞는다. 안 그러면 스도쿠와 지뢰찾기가 같은 날 같은 난수를 쓴다.
 */
import { createRng, hashSeed, type Rng } from './rng.ts';

/** 로컬 기준 'YYYY-MM-DD'. 데일리 퍼즐의 식별자이자 저장 키다. */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 게임 × 날짜 조합의 시드. 같은 조합이면 언제 어디서나 같은 값이다. */
export function dailySeed(gameSlug: string, dateKey: string = todayKey()): number {
  return hashSeed(`${dateKey}:${gameSlug}`);
}

/** 오늘의 퍼즐 생성에 쓸 난수기. */
export function createDailyRng(gameSlug: string, dateKey: string = todayKey()): Rng {
  return createRng(dailySeed(gameSlug, dateKey));
}
