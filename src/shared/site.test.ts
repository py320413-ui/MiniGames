/**
 * [역할]
 *   URL 조립·판별 로직 검증.
 *
 * [왜 이걸 테스트하나]
 *   언어 전환은 "지금 보는 페이지의 다른 언어판"으로 정확히 가야 한다.
 *   여기가 틀리면 사용자는 언어를 바꿀 때마다 홈으로 튕기고, hreflang 도 어긋나
 *   구글이 번역판을 짝지어주지 않는다. 눈으로 확인하기 어려운 종류의 버그다.
 */
import { describe, expect, it } from 'vitest';
import { localeFromPath, sitePath, siteUrl, switchLocalePath } from './site.ts';

describe('sitePath', () => {
  it('기본 로케일(ko)에는 접두사를 붙이지 않는다', () => {
    expect(sitePath('ko')).toBe('/MiniGames/');
    expect(sitePath('ko', 'games/yacht/')).toBe('/MiniGames/games/yacht/');
  });

  it('나머지 로케일에는 접두사를 붙인다', () => {
    expect(sitePath('en')).toBe('/MiniGames/en/');
    expect(sitePath('ja', 'games/yacht/')).toBe('/MiniGames/ja/games/yacht/');
  });
});

describe('siteUrl', () => {
  it('canonical·hreflang 에 쓸 절대 URL을 만든다', () => {
    expect(siteUrl('ko')).toBe('https://py320413-ui.github.io/MiniGames/');
    expect(siteUrl('ja', 'games/yacht/')).toBe(
      'https://py320413-ui.github.io/MiniGames/ja/games/yacht/',
    );
  });
});

describe('localeFromPath', () => {
  it('접두사가 없으면 기본 로케일이다', () => {
    expect(localeFromPath('/MiniGames/')).toBe('ko');
    expect(localeFromPath('/MiniGames/games/yacht/')).toBe('ko');
  });

  it('접두사가 있으면 그 로케일이다', () => {
    expect(localeFromPath('/MiniGames/en/')).toBe('en');
    expect(localeFromPath('/MiniGames/ja/games/yacht/')).toBe('ja');
  });

  it('지원하지 않는 언어 접두사는 기본 로케일로 떨어진다', () => {
    expect(localeFromPath('/MiniGames/de/')).toBe('ko');
  });
});

describe('switchLocalePath', () => {
  it('허브에서 언어를 바꾼다', () => {
    expect(switchLocalePath('/MiniGames/', 'en')).toBe('/MiniGames/en/');
    expect(switchLocalePath('/MiniGames/ja/', 'ko')).toBe('/MiniGames/');
  });

  it('게임 페이지에서는 같은 게임의 다른 언어판으로 간다', () => {
    expect(switchLocalePath('/MiniGames/games/yacht/', 'en')).toBe('/MiniGames/en/games/yacht/');
    expect(switchLocalePath('/MiniGames/en/games/yacht/', 'ja')).toBe('/MiniGames/ja/games/yacht/');
    expect(switchLocalePath('/MiniGames/ja/games/yacht/', 'ko')).toBe('/MiniGames/games/yacht/');
  });

  it('같은 로케일로 바꾸면 제자리다', () => {
    expect(switchLocalePath('/MiniGames/en/games/yacht/', 'en')).toBe('/MiniGames/en/games/yacht/');
  });
});
