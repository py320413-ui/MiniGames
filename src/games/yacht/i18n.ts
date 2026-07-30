/**
 * [역할]
 *   야추 전용 문구. 사이트 공용 카탈로그(src/shared/i18n)와 분리해 둔다.
 *
 * [왜 분리하나]
 *   게임 문구를 공용 카탈로그에 다 밀어넣으면 그 파일이 쓰레기통이 되고,
 *   허브 페이지도 안 쓰는 야추 문구를 내려받게 된다.
 *
 * [주의 — 족보 이름 번역]
 *   직역하지 않는다. 각 언어권에 정착된 표기가 따로 있다.
 *     - 한국어: 포카드 / S. 스트레이트 / 초이스
 *     - 일본어: フォーダイス / S.ストレート / チョイス
 *   직역하면 검색에도 안 걸리고 그 나라 사람에겐 어색하다.
 *   윗칸(1~6)은 숫자만 쓴다 — 실제 야추 점수표가 그렇게 생겼다.
 */
import { createTranslator } from '../../shared/i18n/index.ts';

const ko = {
  // 조작
  'roll': '굴리기',
  'rollsLeft': '남은 굴림 {n}회',
  'rollToStart': '주사위를 굴려 시작하세요',
  'pickCategory': '점수를 넣을 칸을 고르세요',
  'rerollHint': '남길 주사위를 눌러 고정하세요',
  'newGame': '새 게임',
  'scoreInto': '{cat}에 {n}점 넣기',
  'holdOn': '고정됨',
  'holdOff': '고정 안 됨',
  'dieLabel': '{n}의 눈',

  // 진행 상황
  'round': '{n} / {total} 라운드',
  'best': '최고 기록',
  'player': '플레이어 {n}',
  'myScore': '내 점수',

  // 점수표
  'category': '족보',
  'upperSubtotal': '윗칸 소계',
  'bonus': '보너스',
  'bonusNeed': '{n}점 더',
  'bonusGot': '획득',
  'total': '합계',

  // 결과
  'gameOver': '게임 종료',
  'finalScore': '{n}점',
  'winner': '플레이어 {n} 승리',
  'draw': '무승부',
  'newRecord': '최고 기록 경신!',

  // 족보
  'cat.aces': '1',
  'cat.deuces': '2',
  'cat.threes': '3',
  'cat.fours': '4',
  'cat.fives': '5',
  'cat.sixes': '6',
  'cat.choice': '초이스',
  'cat.fourOfAKind': '포카드',
  'cat.fullHouse': '풀하우스',
  'cat.smallStraight': 'S. 스트레이트',
  'cat.largeStraight': 'L. 스트레이트',
  'cat.yacht': '야추',
} as const;

export type YachtKey = keyof typeof ko;

const en: Record<YachtKey, string> = {
  'roll': 'Roll',
  'rollsLeft': '{n} rolls left',
  'rollToStart': 'Roll the dice to start',
  'pickCategory': 'Pick a box to score',
  'rerollHint': 'Tap the dice you want to keep',
  'newGame': 'New game',
  'scoreInto': 'Score {n} in {cat}',
  'holdOn': 'Kept',
  'holdOff': 'Not kept',
  'dieLabel': 'Die showing {n}',

  'round': 'Round {n} of {total}',
  'best': 'Best',
  'player': 'Player {n}',
  'myScore': 'Score',

  'category': 'Category',
  'upperSubtotal': 'Upper subtotal',
  'bonus': 'Bonus',
  'bonusNeed': '{n} to go',
  'bonusGot': 'Earned',
  'total': 'Total',

  'gameOver': 'Game over',
  'finalScore': '{n} points',
  'winner': 'Player {n} wins',
  'draw': 'Draw',
  'newRecord': 'New personal best!',

  'cat.aces': '1',
  'cat.deuces': '2',
  'cat.threes': '3',
  'cat.fours': '4',
  'cat.fives': '5',
  'cat.sixes': '6',
  'cat.choice': 'Choice',
  'cat.fourOfAKind': 'Four of a Kind',
  'cat.fullHouse': 'Full House',
  'cat.smallStraight': 'Small Straight',
  'cat.largeStraight': 'Large Straight',
  'cat.yacht': 'Yacht',
};

const ja: Record<YachtKey, string> = {
  'roll': '振る',
  'rollsLeft': '残り{n}回',
  'rollToStart': 'サイコロを振って始めましょう',
  'pickCategory': '得点を入れる役を選んでください',
  'rerollHint': '残したいサイコロをタップして固定します',
  'newGame': '新しいゲーム',
  'scoreInto': '{cat}に{n}点入れる',
  'holdOn': '固定中',
  'holdOff': '固定なし',
  'dieLabel': '{n}の目',

  'round': '{n} / {total} ラウンド',
  'best': 'ベスト',
  'player': 'プレイヤー{n}',
  'myScore': '得点',

  'category': '役',
  'upperSubtotal': '上段小計',
  'bonus': 'ボーナス',
  'bonusNeed': 'あと{n}点',
  'bonusGot': '獲得',
  'total': '合計',

  'gameOver': 'ゲーム終了',
  'finalScore': '{n}点',
  'winner': 'プレイヤー{n}の勝ち',
  'draw': '引き分け',
  'newRecord': '自己ベスト更新！',

  'cat.aces': '1',
  'cat.deuces': '2',
  'cat.threes': '3',
  'cat.fours': '4',
  'cat.fives': '5',
  'cat.sixes': '6',
  'cat.choice': 'チョイス',
  'cat.fourOfAKind': 'フォーダイス',
  'cat.fullHouse': 'フルハウス',
  'cat.smallStraight': 'S.ストレート',
  'cat.largeStraight': 'L.ストレート',
  'cat.yacht': 'ヨット',
};

/** 야추 문구 조회. t(locale, 'roll') 처럼 쓴다. */
export const ty = createTranslator({ ko, en, ja });
