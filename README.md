# 미니게임 모음

혼자 즐길 수 있는 미니게임을 모은 정적 웹사이트. 설치도 회원가입도 없이 브라우저에서 바로 돈다.
한국어·영어·일본어를 지원하고, Google AdSense로 수익을 내는 것을 목표로 한다.

**사이트**: https://py320413-ui.github.io/MiniGames/

---

## 무엇을 만들고 있나

| | 게임 | 상태 |
|---|---|---|
| 🎲 | 야추 다이스 | **공개** — 혼자서 / 한 기기 2인 |
| 🔢 | 스도쿠 (데일리 퍼즐) | 준비 중 (다음 작업) |
| 💣 | 지뢰찾기 | 예정 |
| 🔟 | 2048 | 예정 |
| 🀄 | 상하이 마작 · 솔리테어 | 예정 |
| 🧱 | 테트리스 | 예정 |
| ♟️ | 체스 (AI 3단계) | 예정 |
| 🎴 | 포커 · 리치 마작 | 나중에 |

1인용 게임을 먼저 쌓는다. 온라인 대전은 서버가 필요하고, 무엇보다 초기에는 상대할 사람이
없어서 빈 대기실이 오히려 이탈 요인이 된다. 검색 유입으로 굴러가는 사이트에는
싱글플레이와 퍼즐이 맞다.

---

## 왜 이런 구조인가

### 게임마다, 언어마다 진짜 HTML 페이지

```
py320413-ui.github.io/MiniGames/                  한국어 허브
                              /games/yacht/       한국어 야추
                              /en/games/yacht/    영어 야추
                              /ja/games/yacht/    일본어 야추
```

SPA 라우팅이나 자바스크립트 언어 전환으로 만들면 구글이 한 버전만 색인한다.
그러면 게임을 아무리 늘려도, 언어를 아무리 붙여도 검색에 잡히는 페이지는 하나뿐이다.
그래서 **Vite를 MPA(다중 페이지) 모드**로 쓰고, 페이지를 빌드 전에 찍어낸다.

### 페이지는 손으로 쓰지 않고 생성한다

```
src/shared/games.ts   ─┐
src/shared/i18n/*.ts  ─┼─→  scripts/gen-pages.mjs  ─→  index.html
content/{locale}/*    ─┘                                en/index.html
                                                        ja/index.html
                                                        sitemap.xml
```

지금은 3장이지만 게임 10개 × 언어 10개면 100장이 된다. 손으로 관리할 수 있는 규모가 아니다.
덕분에 **게임 추가는 폴더 하나, 언어 추가는 파일 하나**로 끝난다.

### 번역 누락은 컴파일 에러

```ts
// src/shared/i18n/ko.ts 가 키의 원천
export type MessageKey = keyof typeof ko;

// en.ts / ja.ts 는 이 타입을 만족해야 한다
export const en: Record<MessageKey, string> = { ... };  // 하나라도 빠지면 빌드 실패
```

언어가 늘어날수록 번역 누락이 조용히 새는 게 가장 흔한 사고다. 타입으로 막는다.

### 시드 난수 하나가 세 문제를 푼다

`Math.random()` 은 시드를 줄 수 없다. `src/shared/rng.ts` 의 시드 난수는:

1. **오늘의 퍼즐** — 날짜를 시드로 쓰면 같은 날 접속한 사람은 같은 문제를 푼다. 서버가 필요 없다
2. **재현** — 버그 난 판을 다시 만들어 볼 수 있다
3. **테스트** — 난수가 끼어도 결과가 고정되어 검증할 수 있다

데일리 퍼즐은 습관을 만들어 재방문을 붙이고, 재방문은 곧 광고 노출이다.

---

## 구조

```
MiniGames/
├─ src/
│  ├─ shared/            게임이 공유하는 것
│  │  ├─ site.ts           도메인·경로·로케일 (URL의 단일 진실 공급원)
│  │  ├─ games.ts          게임 목록
│  │  ├─ i18n/             메시지 카탈로그 3개 언어
│  │  ├─ html.ts · hub.ts  페이지 HTML 조립
│  │  ├─ shell.ts          브라우저 동작 (언어 배너, 광고)
│  │  ├─ rng.ts · daily.ts 시드 난수 · 오늘의 퍼즐
│  │  ├─ difficulty.ts     난이도 공용 규격
│  │  └─ styles/           tokens → base → shell
│  └─ games/<slug>/      게임별 소스 (아직 없음)
│     ├─ scoring.ts        점수·판정 (순수 함수, 테스트 대상)
│     ├─ engine.ts         상태 전이 (DOM 모름)
│     ├─ ui.ts             렌더링
│     └─ main.ts           진입점
├─ scripts/gen-pages.mjs  페이지 생성기
├─ content/{ko,en,ja}/    게임 규칙 설명 본문 (SEO 콘텐츠)
├─ public/                그대로 복사되는 파일
└─ index.html, en/, ja/   ← 생성물. 손대지 말 것
```

**핵심 원칙**: 게임 로직은 DOM도 언어도 모르는 순수 TypeScript로 쓴다.
점수 계산과 상태 전이가 순수 함수라 테스트가 되고, 나중에 규칙이 복잡한 게임
(리치 마작의 역·부수 계산)에서 이 분리가 결정적이다.

---

## 시작하기

```bash
npm install
npm run dev
```

http://localhost:5173/MiniGames/ 가 열린다.

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 (페이지 생성이 먼저 돈다) |
| `npm run build` | 타입검사 + 빌드 → `dist/` |
| `npm run preview` | 빌드 결과 확인 |
| `npm run test` | 순수 로직 테스트 |

요구사항: Node.js 22 이상 (빌드 스크립트가 `.ts` 를 직접 실행한다)

---

## 배포

GitHub Actions가 `npm run build` 후 `dist/` 를 GitHub Pages로 올린다.
빌드 산출물은 커밋하지 않는다. Public 리포라 Actions 시간 제한이 없다.

커스텀 도메인으로 옮길 때는 `src/shared/site.ts` 의 `SITE_ORIGIN` 과 `BASE_PATH`
두 줄만 고치면 된다. canonical·hreflang·sitemap이 전부 거기서 파생된다.

---

## 수익화 계획

1. 게임 4개 + 언어별 규칙 설명 본문 확보
2. 소개 · 개인정보처리방침 · 문의 페이지 작성 (심사에서 사실상 요구된다)
3. AdSense 신청 → `src/shared/ads.ts` 의 `ADSENSE_CLIENT` 한 줄 채우기
4. 수익이 붙으면 커스텀 도메인 + `ads.txt`
5. 광고 단가 높은 언어(독일어·프랑스어·북유럽) 순으로 확장

광고는 게임 조작 영역 근처에 두지 않는다. 실수 클릭을 유도하는 배치는 정책 위반이고
계정 정지 사유다. 자세한 주의사항은 [CLAUDE.md](CLAUDE.md) 참고.
