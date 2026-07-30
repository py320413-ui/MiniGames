/**
 * [역할]
 *   야추의 도메인 타입. 주사위·족보·점수표·게임 상태의 형태를 정한다.
 *
 * [주의]
 *   - 주사위는 항상 5개, 홀드 플래그도 항상 5개다(DICE_COUNT).
 *     튜플로 못 박지 않은 건 굴릴 때마다 map 으로 새로 만드는 코드가 지저분해지기 때문이다.
 *   - 상태는 전부 readonly 다. 엔진 함수는 상태를 고치지 않고 새 상태를 돌려준다.
 */

/** 주사위 눈. */
export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

/** 주사위 5개. 길이는 항상 DICE_COUNT. */
export type Dice = readonly DieValue[];

/** 어떤 주사위를 고정했는지. 길이는 항상 DICE_COUNT. */
export type Holds = readonly boolean[];

/** 윗칸 — 해당 눈의 합. */
export type UpperCategory = 'aces' | 'deuces' | 'threes' | 'fours' | 'fives' | 'sixes';

/** 아랫칸. */
export type LowerCategory =
  | 'choice'
  | 'fourOfAKind'
  | 'fullHouse'
  | 'smallStraight'
  | 'largeStraight'
  | 'yacht';

export type Category = UpperCategory | LowerCategory;

/** 점수표. null 은 아직 안 채운 칸이다. 0 과 구별해야 한다 — 0점으로 채운 칸도 있다. */
export type ScoreCard = Readonly<Record<Category, number | null>>;

export interface PlayerState {
  readonly card: ScoreCard;
}

/**
 * 게임 상태 전체.
 *
 * 파생 가능한 값(라운드 번호, 종료 여부, 굴렸는지)은 여기 두지 않는다.
 * 중복해서 들고 있으면 어긋날 수 있어서, engine.ts 의 선택자 함수로 계산한다.
 */
export interface GameState {
  readonly players: readonly PlayerState[];
  /** 지금 차례인 플레이어 인덱스. */
  readonly current: number;
  readonly dice: Dice;
  readonly held: Holds;
  /** 이번 턴에 남은 굴림 횟수. MAX_ROLLS 면 아직 한 번도 안 굴린 것이다. */
  readonly rollsLeft: number;
}
