/**
 * [역할]
 *   한국어 메시지 카탈로그. 이 파일이 **모든 메시지 키의 원천**이다.
 *   en.ts / ja.ts 는 여기서 뽑은 MessageKey 타입을 만족해야 하므로,
 *   여기에 키를 추가하면 나머지 언어에서 컴파일 에러가 나며 번역 누락을 알려준다.
 *
 * [주의]
 *   - 게임 고유 문구(야추 족보 이름 등)는 여기 넣지 않는다. 게임 폴더 안에 따로 둔다.
 *     여기는 사이트 공통 UI 만 담당한다. 안 그러면 이 파일이 쓰레기통이 된다.
 *   - {year} 처럼 중괄호로 감싼 부분은 t() 가 값으로 치환한다.
 */
export const ko = {
  // 사이트
  'site.name': '미니게임 모음',
  'site.tagline': '설치 없이 브라우저에서 바로 즐기는 무료 미니게임',
  'site.description':
    '야추 다이스, 스도쿠 같은 미니게임을 설치 없이 브라우저에서 무료로 즐기세요. 회원가입도 필요 없습니다.',

  // 내비게이션
  'nav.home': '홈',
  'nav.about': '소개',
  'nav.privacy': '개인정보처리방침',
  'nav.contact': '문의',

  // 허브(게임 목록)
  'hub.heading': '무엇을 하고 놀까요?',
  'hub.intro': '전부 무료고 회원가입도 필요 없습니다. 카드를 눌러 바로 시작하세요.',
  'hub.play': '시작하기',
  'hub.comingSoon': '준비 중',

  // 플레이 모드
  'mode.solo': '혼자서',
  'mode.local2p': '둘이서 (한 기기)',
  'mode.vsAi': 'AI 대전',
  'mode.daily': '오늘의 문제',

  // 난이도
  'difficulty.label': '난이도',
  'difficulty.easy': '쉬움',
  'difficulty.normal': '보통',
  'difficulty.hard': '어려움',

  // 언어 전환
  'lang.label': '언어',
  'lang.suggest': '한국어 버전이 있습니다',
  'lang.goto': '이동',
  'lang.dismiss': '닫기',

  // 푸터 · 접근성
  'footer.rights': '© {year} 미니게임 모음',
  'skip.toContent': '본문으로 건너뛰기',
} as const;

/** 모든 로케일이 반드시 채워야 하는 키 집합. */
export type MessageKey = keyof typeof ko;
