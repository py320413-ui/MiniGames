/**
 * [역할]
 *   영어 메시지 카탈로그.
 *
 * [주의]
 *   Record<MessageKey, string> 타입이 걸려 있어서 ko.ts 에 있는 키를 하나라도 빠뜨리면
 *   `npm run build` 가 실패한다. 번역 누락이 조용히 새지 않게 하는 장치다.
 */
import type { MessageKey } from './ko.ts';

export const en: Record<MessageKey, string> = {
  // Site
  'site.name': 'Mini Game Collection',
  'site.tagline': 'Free browser mini games — nothing to install',
  'site.description':
    'Play Yacht Dice, Sudoku and other mini games right in your browser. Free, with no install and no sign-up.',

  // Navigation
  'nav.home': 'Home',
  'nav.about': 'About',
  'nav.privacy': 'Privacy Policy',
  'nav.contact': 'Contact',

  // Hub (game list)
  'hub.heading': 'What would you like to play?',
  'hub.intro': 'Everything here is free and no account is needed. Pick a card to start.',
  'hub.play': 'Play',
  'hub.comingSoon': 'Coming soon',

  // Play modes
  'mode.solo': 'Single player',
  'mode.local2p': 'Two players (same device)',
  'mode.vsAi': 'vs Computer',
  'mode.daily': 'Daily puzzle',

  // Difficulty
  'difficulty.label': 'Difficulty',
  'difficulty.easy': 'Easy',
  'difficulty.normal': 'Normal',
  'difficulty.hard': 'Hard',

  // Language switching
  'lang.label': 'Language',
  'lang.suggest': 'English version available',
  'lang.goto': 'Go',
  'lang.dismiss': 'Dismiss',

  // Footer · accessibility
  'footer.rights': '© {year} Mini Game Collection',
  'skip.toContent': 'Skip to content',
};
