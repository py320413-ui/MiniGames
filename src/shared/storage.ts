/**
 * [역할]
 *   localStorage 래퍼. 최고점수·진행상황·언어선택·난이도선택을 저장한다.
 *
 * [주의]
 *   localStorage 는 생각보다 자주 터진다. 사파리 시크릿 모드는 setItem 에서 예외를 던지고,
 *   브라우저 설정이나 확장 프로그램이 접근 자체를 막기도 한다.
 *   여기서 전부 삼켜서, 저장이 안 되더라도 게임은 계속 돌아가게 한다.
 *   저장 실패가 게임을 멈추게 하면 안 된다.
 */

/** 다른 사이트·다른 앱과 키가 섞이지 않게 하는 접두사. */
const PREFIX = 'minigames:';

/** 저장된 값을 읽는다. 없거나 깨졌으면 fallback 을 돌려준다. */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // 접근 차단이거나 JSON 이 깨진 경우. 기본값으로 계속 간다.
    return fallback;
  }
}

/** 값을 저장한다. 실패해도 조용히 넘어간다. */
export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 저장 용량 초과나 접근 차단. 게임 진행에는 영향을 주지 않는다.
  }
}

/** 값을 지운다. */
export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // 위와 같다.
  }
}
