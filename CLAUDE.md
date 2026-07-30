# CLAUDE.md

미니게임 포털. 야추·스도쿠 같은 **1인용 미니게임**을 모아 한국어·영어·일본어로 서비스하고,
Google AdSense로 수익을 내는 정적 사이트다.

---

## 절대 헷갈리지 말 것

**1. 루트의 `index.html`, `en/`, `ja/`, `games/` 는 전부 생성물이다.**
손으로 고쳐도 다음 `npm run dev` 에서 통째로 덮어써진다. 고칠 곳은 이쪽이다:

| 고치고 싶은 것 | 실제로 열 파일 |
|---|---|
| 페이지 뼈대·meta·헤더·푸터 | `src/shared/html.ts` |
| 허브 카드 배치 | `src/shared/hub.ts` |
| 화면에 보이는 문구 | `src/shared/i18n/{ko,en,ja}.ts` |
| 게임 목록·게임 소개글 | `src/shared/games.ts` |
| 생성 규칙 자체 | `scripts/gen-pages.mjs` |

**2. `src/games/` 와 루트 `games/` 는 다른 것이다.**
`src/games/` 는 손으로 쓰는 소스, 루트 `games/` 는 생성된 HTML이다.

**3. 게임 로직은 DOM도 언어도 모르는 순수 TS로 쓴다.**
`engine.ts`/`scoring.ts` 는 상태를 받아 새 상태를 돌려주기만 한다.
`ui.ts` 가 그리고, 문자열은 `t()` 로 주입한다. 테스트가 가능해지고,
나중에 규칙이 복잡한 게임(리치 마작)에서 이 분리가 결정적이다.

**4. 경로를 하드코딩하지 않는다.**
`/MiniGames/` 는 `src/shared/site.ts` 에만 있다. 커스텀 도메인으로 옮길 때
`SITE_ORIGIN` 과 `BASE_PATH` 두 줄만 바꾸면 되게 하려는 것이다.

---

## 명령어

```bash
npm run dev        # 개발 서버 (localhost:5173/MiniGames/) — gen 이 먼저 돈다
npm run build      # 타입검사 + 빌드 → dist/
npm run preview    # 빌드 결과 확인 (localhost:4173/MiniGames/)
npm run test       # 순수 로직 테스트
npm run typecheck  # 타입만 검사
npm run gen        # 페이지 생성만 수동 실행
```

---

## 파일별 역할

### `src/shared/` — 게임이 공유하는 것

| 파일 | 역할 |
|---|---|
| `site.ts` | 도메인·경로·로케일. **URL의 단일 진실 공급원** |
| `types.ts` | `GameMeta`, `GameMode`, `Difficulty` 등 공용 타입 |
| `games.ts` | 게임 목록. 허브·페이지생성·sitemap이 전부 여기서 나온다 |
| `i18n/ko.ts` | **메시지 키의 원천.** 여기 키를 추가하면 en/ja 에서 컴파일 에러가 난다 |
| `i18n/index.ts` | `t()`, 브라우저 언어 판별 |
| `html.ts` | 페이지 HTML 조립 (head·hreflang·헤더·푸터) |
| `hub.ts` | 허브 본문(게임 카드) |
| `shell.ts` | 브라우저 동작 — 언어 제안 배너, 광고 자리 채우기 |
| `rng.ts` | 시드 난수. 퍼즐 생성·데일리·테스트의 토대 |
| `daily.ts` | 날짜 → 시드. 서버 없이 '오늘의 퍼즐'을 만든다 |
| `difficulty.ts` | 난이도 공용 규격(타입·저장·라벨) |
| `storage.ts` | localStorage 래퍼. 실패해도 게임이 멈추지 않는다 |
| `ads.ts` | AdSense 슬롯. 지금은 ID가 비어 있어 아무것도 안 그린다 |
| `styles/` | `tokens.css`(색·간격) → `base.css`(바탕) → `shell.css`(공용 조각) |

### 나머지

| 경로 | 역할 |
|---|---|
| `scripts/gen-pages.mjs` | 로케일 × 페이지 HTML + sitemap + robots 생성 |
| `content/{locale}/` | 게임 규칙 설명 본문(SEO 콘텐츠). 아직 비어 있음 |
| `.generated/manifest.json` | 생성한 파일 목록. `vite.config.ts` 가 진입점을 여기서 읽는다 |
| `public/` | 그대로 복사되는 정적 파일 |

---

## 게임 추가하는 법

1. `src/shared/games.ts` 에 `GameMeta` 추가 — **`status: 'soon'` 으로 시작**
2. `src/games/<slug>/` 에 `types.ts` → `scoring.ts`(+`*.test.ts`) → `engine.ts` → `ui.ts` → `main.ts` 순으로 작성
3. `content/{ko,en,ja}/<slug>-rules.html` 에 규칙 설명 본문 작성
4. `status: 'live'` 로 변경 → 페이지가 생성되고 허브 카드가 링크로 바뀐다

`status: 'soon'` 인 동안에는 허브에 '준비 중' 카드로만 뜨고 페이지는 만들어지지 않는다.
아직 없는 페이지로 링크가 걸려 404가 나는 걸 막는 장치다.

## 언어 추가하는 법

1. `src/shared/site.ts` 의 `LOCALES` 에 추가 → `HTML_LANG`, `LOCALE_LABEL` 도 채운다
2. `src/shared/i18n/<locale>.ts` 를 만든다 (`Record<MessageKey, string>` 이라 누락하면 빌드가 깨진다)
3. `i18n/index.ts` 의 `CATALOGS` 에 등록
4. `games.ts` 의 각 게임 `i18n` 에 해당 로케일 추가
5. **`.gitignore` 에 `/<locale>/` 을 추가한다** ← 잊으면 생성된 HTML이 통째로 커밋된다

---

## 함정들 (실제로 밟은 것)

**Vite root 를 `.generated/` 로 잡으면 안 된다.**
처음에 생성 HTML을 `.generated/` 에 두고 거기를 root 로 잡았더니,
HTML이 `../src/...` 를 참조할 때 root 를 벗어나 dev 서버가 404를 냈다.
`src/` 가 root 안에 있어야 경로가 풀린다. 그래서 HTML을 프로젝트 루트에 찍는다.

**생성물 정리는 매니페스트로만 한다.**
생성 HTML이 프로젝트 루트에 섞여 있어서 `rm -rf games/` 같은 걸 하면 위험하다.
`gen-pages.mjs` 는 `.generated/manifest.json` 에 적힌 파일만 지운다.

**`scripts/*.mjs` 가 `.ts` 를 직접 import 한다.**
Node 24의 타입 스트리핑 덕분이다. 그래서 `src/` 에서 **`enum`·`namespace` 를 쓰면 안 된다.**
코드 생성이 필요한 문법이라 스트리핑이 처리하지 못하고 빌드가 깨진다. 유니온 타입으로만 쓸 것.

**`robots.txt` 는 지금 크롤러에게 무시된다.**
프로젝트 리포로 배포하는 동안 크롤러는 `py320413-ui.github.io/robots.txt` 만 읽는데
그건 우리 것이 아니다. **sitemap은 Google Search Console 에 직접 제출해야 한다.**
같은 이유로 `ads.txt` 도 못 올린다 — 커스텀 도메인을 사면 그때 해결된다.

**기본 로케일(`ko`)을 바꾸면 모든 URL이 변한다.**
쌓아둔 SEO를 통째로 잃는다. 언어 *추가*는 싸지만 기본 언어 *변경*은 비싸다.

**언어 제안 배너는 리다이렉트가 아니다.**
브라우저 언어로 자동 이동시키면 구글 크롤러가 어떤 URL로 들어와도 한 언어판만 보게 되어
나머지가 색인되지 않는다. 제안만 하고 이동은 사용자가 고른다.

---

## AdSense 관련 (돈이 걸린 부분)

- **`ads.ts` 의 `ADSENSE_CLIENT` 는 비어 있다.** 승인 후 채운다. 비밀값이 아니다.
- **게임 1~2개로는 승인되지 않는다.** 게임 4개 + 언어별 규칙 설명 본문이 쌓인 뒤 신청한다.
- **광고를 게임 조작 영역 근처에 두지 않는다.** 주사위·격자·버튼 근처나 바로 위는 금지다.
  실수 클릭을 유도하는 배치는 정책 위반이고 계정 정지 사유다. 게임 '아래'와 사이드바만 쓴다.
- **포커는 제한 콘텐츠 영역이다.** 최초 심사 전에는 올리지 않는다.

---

## 디자인 방향

한국 포털(네이버) 감각을 절반쯤 섞었다. 흰 바탕, 그린 강조 하나(#03c75a),
좁은 라운드(6~10px), 촘촘한 여백. 어두운 배경 + 청록/보라 그라데이션 같은
'요즘 템플릿' 조합은 피한다. 색은 전부 `tokens.css` 의 `var()` 로만 쓴다.

---

## 야추 — 이후 게임이 따라갈 본보기

`src/games/yacht/` 가 게임 폴더의 표준 구성이다. 새 게임도 같은 모양으로 만든다.

| 파일 | 역할 | DOM을 아는가 |
|---|---|---|
| `types.ts` | 도메인 타입 | 모름 |
| `scoring.ts` | 족보 판정·점수 계산 (순수 함수) | 모름 |
| `engine.ts` | 상태 전이. 난수를 **인자로 받는다** | 모름 |
| `ui.ts` | 그리기만 한다 | 앎 |
| `i18n.ts` | 게임 전용 문구 3개 언어 | 모름 |
| `main.ts` | 상태를 들고 엔진과 화면을 잇는다 | 앎 |
| `style.css` | `main.ts` 가 import → 이 페이지에서만 로드 |  |

지켜야 할 것 세 가지:

1. **난수는 엔진 밖에서 넣는다.** `roll(state, rng)` 처럼 받으면 테스트에서 주사위를 고정할 수 있다. 엔진 안에서 `Math.random()` 을 부르면 그 순간 테스트가 불가능해진다.
2. **잘못된 조작은 예외를 던지지 않고 상태를 그대로 돌려준다.** UI 가 버튼을 잠그는 게 1차 방어지만 연타로 새는 경우가 있고, 그때 게임이 죽는 것보다 아무 일도 안 일어나는 게 낫다.
3. **UI 는 DOM 을 한 번만 짓고 값만 갱신한다.** 통째로 다시 그리면 애니메이션이 끊기고 키보드 초점이 날아간다.

야추 규칙은 한국식이다 — 포카드·풀하우스가 주사위 5개의 합이고(미국식 Yahtzee 의 25점 고정과 다르다), 같은 눈 5개도 풀하우스로 인정한다. `scoring.ts` 헤더와 `content/*/yacht-rules.html` 에 명시해 뒀다.

---

## 현재 상태

야추 공개. 허브와 게임이 3개 언어로 돌고 GitHub Pages 에 배포돼 있다.

- 사이트: https://py320413-ui.github.io/MiniGames/
- 게임 1개(야추). 스도쿠는 `status: 'soon'` 으로 카드만 떠 있다
- 테스트 74개
- 소개·개인정보처리방침·문의 페이지가 아직 없다 — **AdSense 신청 전 필수**
- sitemap 을 Google Search Console 에 아직 제출하지 않았다

다음: **스도쿠** → 지뢰찾기 → 2048 → (게임 4개 시점) AdSense 신청.
