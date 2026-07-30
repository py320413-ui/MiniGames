/**
 * [역할]
 *   게임 목록. 허브 카드·페이지 생성·sitemap 이 전부 이 배열 하나를 읽는다.
 *   게임을 추가할 때 손대는 첫 번째 파일이다.
 *
 * [게임 추가 순서]
 *   1. 여기에 GameMeta 를 추가한다 (status: 'soon' 으로 시작)
 *   2. src/games/<slug>/main.ts 를 만든다
 *   3. content/{ko,en,ja}/<slug>-rules.html 에 규칙 설명 본문을 쓴다
 *   4. status 를 'live' 로 바꾸면 페이지가 생성되고 허브 카드가 눌리게 된다
 *
 * [주의]
 *   - title·description 은 검색 결과에 그대로 노출된다. 기계번역투를 쓰지 말 것.
 *   - status: 'soon' 인 게임은 허브에 '준비 중' 카드로만 뜨고 페이지는 만들어지지 않는다.
 *     아직 없는 페이지로 링크가 걸려 404 가 나는 걸 막는 장치다.
 */
import type { GameMeta } from './types.ts';

export const GAMES: GameMeta[] = [
  {
    slug: 'yacht',
    emoji: '🎲',
    status: 'live',
    modes: ['solo', 'local-2p'],
    i18n: {
      ko: {
        title: '야추 다이스',
        description:
          '주사위 5개를 최대 3번까지 굴려 족보를 만들고 점수를 겨루는 게임. 12칸을 모두 채우면 끝납니다.',
      },
      en: {
        title: 'Yacht Dice',
        description:
          'Roll five dice up to three times, then claim the best category on your scorecard. The game ends when all twelve boxes are filled.',
      },
      ja: {
        title: 'ヨットダイス',
        description:
          'サイコロ5個を3回まで振り直して役を作り、得点を競うゲーム。12マスすべてを埋めると終了です。',
      },
    },
  },
  {
    slug: 'sudoku',
    emoji: '🔢',
    status: 'soon',
    modes: ['solo', 'daily'],
    difficulties: ['easy', 'normal', 'hard'],
    i18n: {
      ko: {
        title: '스도쿠',
        description:
          '9×9 격자를 1부터 9까지의 숫자로 채우는 논리 퍼즐. 매일 새로운 문제가 자동으로 만들어집니다.',
      },
      en: {
        title: 'Sudoku',
        description:
          'Fill the 9×9 grid so every row, column and box holds the digits 1 to 9. A fresh puzzle is generated every day.',
      },
      ja: {
        title: '数独',
        description:
          '9×9のマスを1から9の数字で埋める論理パズル。毎日新しい問題が自動で作られます。',
      },
    },
  },
];

/** 실제 페이지가 만들어지는 게임만. 페이지 생성기와 sitemap 이 쓴다. */
export const LIVE_GAMES = GAMES.filter((game) => game.status === 'live');

/** 슬러그로 게임을 찾는다. 없으면 undefined. */
export function findGame(slug: string): GameMeta | undefined {
  return GAMES.find((game) => game.slug === slug);
}

/** 게임 페이지의 사이트 내부 경로 조각. sitePath()/siteUrl() 에 넘겨 쓴다. */
export function gamePath(slug: string): string {
  return `games/${slug}/`;
}
