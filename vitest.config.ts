/**
 * [역할]
 *   테스트 전용 설정. vite.config.ts 와 분리한 이유가 있다.
 *   그쪽은 root 가 .generated/ 라서 src/ 아래의 테스트 파일을 찾지 못한다.
 *
 * [주의]
 *   게임 로직은 DOM을 모르는 순수 함수로 짜는 게 원칙이라 environment 는 node 로 둔다.
 *   DOM이 필요한 테스트가 생기면 그 파일에만 // @vitest-environment jsdom 을 붙인다.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
