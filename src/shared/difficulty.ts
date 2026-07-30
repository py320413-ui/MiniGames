/**
 * [역할]
 *   난이도 공용 규격. 타입·순서·저장·라벨을 한 곳에서 관리한다.
 *
 * [설계 방향]
 *   난이도의 **의미**는 여기서 정하지 않는다. 게임마다 다르게 해석한다.
 *     - 체스: 탐색 깊이와 일부러 실수할 확률
 *     - 스도쿠: 남기는 힌트 개수와 허용하는 풀이 기법 수준
 *     - 지뢰찾기: 판 크기와 지뢰 밀도
 *   여기는 '어떤 값이 있고, 어떻게 저장하고, 뭐라고 부를지'만 담당한다.
 *
 * [주의]
 *   난이도를 게임마다 새로 만들지 말 것. 선택 UI와 저장이 게임마다 달라지면
 *   사용자는 매번 다른 조작을 배워야 하고, 코드는 같은 걸 여러 벌 갖게 된다.
 */
import type { Difficulty } from './types.ts';
import type { MessageKey } from './i18n/index.ts';
import { readJson, writeJson } from './storage.ts';

/** 표시 순서. 쉬운 것부터. */
export const DIFFICULTIES = ['easy', 'normal', 'hard'] as const satisfies readonly Difficulty[];

/** 난이도를 안 고른 사용자에게 줄 기본값. */
export const DEFAULT_DIFFICULTY: Difficulty = 'normal';

/** 난이도 라벨의 메시지 키. i18n 카탈로그의 difficulty.* 와 짝을 이룬다. */
export function difficultyMessageKey(value: Difficulty): MessageKey {
  return `difficulty.${value}` as MessageKey;
}

/** 문자열이 유효한 난이도인지 확인한다. localStorage 에서 읽은 값 검증에 쓴다. */
export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && DIFFICULTIES.some((d) => d === value);
}

/**
 * 게임별로 마지막에 고른 난이도를 읽는다.
 * 저장된 값이 깨졌거나 없으면 기본값으로 떨어진다.
 */
export function loadDifficulty(gameSlug: string): Difficulty {
  const saved = readJson<unknown>(`difficulty:${gameSlug}`, null);
  return isDifficulty(saved) ? saved : DEFAULT_DIFFICULTY;
}

/** 고른 난이도를 저장한다. 다음 방문 때 그대로 이어진다. */
export function saveDifficulty(gameSlug: string, value: Difficulty): void {
  writeJson(`difficulty:${gameSlug}`, value);
}
