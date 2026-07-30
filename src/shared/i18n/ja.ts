/**
 * [역할]
 *   일본어 메시지 카탈로그.
 *
 * [주의]
 *   게임 용어는 직역하지 않는다. 일본어권에는 정착된 표기가 따로 있다
 *   (예: Small Straight → 「S.ストレート」). 직역하면 검색도 안 잡히고 어색하다.
 */
import type { MessageKey } from './ko.ts';

export const ja: Record<MessageKey, string> = {
  // サイト
  'site.name': 'ミニゲーム集',
  'site.tagline': 'インストール不要、ブラウザですぐ遊べる無料ミニゲーム',
  'site.description':
    'ヨットダイスや数独などのミニゲームを、インストールなしでブラウザから無料で遊べます。会員登録も不要です。',

  // ナビゲーション
  'nav.home': 'ホーム',
  'nav.about': 'このサイトについて',
  'nav.privacy': 'プライバシーポリシー',
  'nav.contact': 'お問い合わせ',

  // ハブ（ゲーム一覧）
  'hub.heading': '今日は何で遊びますか？',
  'hub.intro': 'すべて無料、会員登録も不要です。カードを選んですぐ始められます。',
  'hub.play': 'あそぶ',
  'hub.comingSoon': '準備中',

  // プレイモード
  'mode.solo': 'ひとりで',
  'mode.local2p': 'ふたりで（1台）',
  'mode.vsAi': 'AI対戦',
  'mode.daily': '今日の問題',

  // 難易度
  'difficulty.label': '難易度',
  'difficulty.easy': 'かんたん',
  'difficulty.normal': 'ふつう',
  'difficulty.hard': 'むずかしい',

  // 言語切り替え
  'lang.label': '言語',
  'lang.suggest': '日本語版があります',
  'lang.goto': '移動',
  'lang.dismiss': '閉じる',

  // フッター・アクセシビリティ
  'footer.rights': '© {year} ミニゲーム集',
  'skip.toContent': '本文へスキップ',
};
