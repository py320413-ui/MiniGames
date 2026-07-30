/**
 * [역할]
 *   여러 게임이 공유하는 도메인 타입. 게임 목록·난이도·모드의 형태를 여기서 정한다.
 *
 * [주의]
 *   enum 을 쓰지 않는다. Node 의 타입 스트리핑(scripts/*.mjs 에서 .ts 직접 import)이
 *   enum 처럼 코드 생성이 필요한 문법을 지원하지 않기 때문이다. 유니온 타입으로 쓴다.
 */
import type { Locale } from './site.ts';

/** 게임이 제공하는 플레이 방식. */
export type GameMode =
  | 'solo' // 혼자서 (점수 겨루기)
  | 'local-2p' // 한 기기에서 둘이 번갈아
  | 'vs-ai' // AI 대전
  | 'daily'; // 날짜 시드 기반 오늘의 문제

/**
 * 난이도. AI 게임은 탐색 파라미터로, 퍼즐 게임은 힌트 개수·허용 기법으로 해석한다.
 * 각 게임이 이 값을 자기 방식으로 번역해 쓴다 — 의미를 여기서 고정하지 않는다.
 */
export type Difficulty = 'easy' | 'normal' | 'hard';

/** 게임 공개 상태. soon 은 허브에 '준비 중' 카드로만 뜨고 페이지는 생성되지 않는다. */
export type GameStatus = 'live' | 'soon';

/** 로케일별 게임 문구. 검색 결과에 그대로 노출되므로 번역투를 피한다. */
export interface GameText {
  /** 게임 이름. <title> 과 카드 제목에 쓰인다. */
  title: string;
  /** 한 문장 소개. meta description 과 카드 설명에 쓰인다. */
  description: string;
}

/**
 * 게임 하나의 메타데이터.
 * 허브 목록·페이지 생성·sitemap 이 전부 이걸 읽는다. 게임 추가는 여기 한 줄로 시작한다.
 */
export interface GameMeta {
  /** URL 조각. ASCII 소문자와 하이픈만. 'yacht' → /games/yacht/ */
  slug: string;
  /** 카드에 띄울 이모지. 그림 에셋을 준비하기 전까지의 자리표시자다. */
  emoji: string;
  status: GameStatus;
  modes: GameMode[];
  /** 난이도 개념이 있는 게임만 채운다. 없으면 난이도 선택 UI가 안 뜬다. */
  difficulties?: Difficulty[];
  i18n: Record<Locale, GameText>;
}
