# 최신 안정 의존성 업데이트와 로컬 검증

**목표:** 2026-11-13 npm `latest`에 해당하는 직접 의존성, PostCSS override, Node.js LTS를 사용하고 기존 공개 사이트와 관리자 기능을 보존한다.

**기준:** `f75eb20`, `codex/portfolio-redesign`. 작업 시작 시 작업 트리는 깨끗하다. 직전 검증의 238개 단위 테스트, 57개 브라우저 검사, TypeScript/ESLint/격리 production build 기록은 `.verification/project-audit-20261113`에 보존한다.

**방식:** 기존 체크아웃에서 구현하며 별도 Git worktree는 만들지 않는다. 기존 변경이 포함된 현재 프로젝트 자체를 업데이트하기 위한 선택이다. 검증 실행 환경은 loopback 앱/합성 API와 외부 네트워크 차단으로 격리한다. Node.js 26.13.1은 프로젝트의 무시된 검증 디렉터리에 내려받고 공식 SHA-256을 확인한다. 시스템 전역 Node 설정은 바꾸지 않는다.

## 제약

- 대화는 한국어로 한다. Dev/Live 서버에 직접 접속하지 않는다.
- 패키지 다운로드와 공식 버전/마이그레이션 문서만 외부에서 읽는다. 런타임 검증에서는 Node TCP/DNS/fetch guard 및 Chrome HTTP/WebSocket/proxy guard를 유지한다.
- 디자인, 콘텐츠, API 계약, 인증, 검색/필터/정렬/페이지 이동, 저장, 이미지 업로드, 정화, 모션을 유지한다.
- 버전 충돌을 `--force`/`--legacy-peer-deps`로 숨기거나 타입 검사를 끄지 않는다.
- TypeScript 7의 API 제거는 Microsoft의 안정 호환 패키지/공식 npm alias 방식을 우선 검토한다. 실제 타입 검사는 7의 native `tsc`로 실행하며 도구용 6 API가 필요하면 역할을 명시한다.
- 최초 업데이트는 미커밋 상태로 검토했고, 후속 사용자 요청으로 현재 구성을 유지한 로컬 커밋이 승인되었다. 푸시·배포는 별도 요청이 필요하다. 증거는 `.verification/dependency-upgrade-20261113`에 보존한다.

## 실행 순서

- [x] 1. 현재 manifest/lock/source 상태와 기존 검증 증거를 보존하고 동일 합성 데이터로 업데이트 전 화면·편집 동작 기준을 수집한다.
- [x] 2. 공식 registry 버전을 재확인하고 모든 직접 의존성/override를 최신 안정 버전으로 설치한다. 최신 Node LTS, npm lockfile, 버전 선택 기록을 남긴다.
- [x] 3. 실제 실패 로그를 기준으로 TypeScript/ESLint/Next/편집기 호환성을 수정한다. 행동 수정에는 해당 실패를 재현하는 회귀 검증을 먼저 실행한다.
- [x] 4. 전체 단위 테스트, ESLint, TypeScript 7 타입 검사, 외부 차단 production build를 통과시킨다.
- [x] 5. 로컬 production에서 smoke 57, 기본 모션 5, 연결 모션 13, 모바일 필터/목차, 글·프로젝트 편집·저장·재진입·이미지 업로드·정화 검증을 실행한다. 업데이트 전후 화면/본문 차이를 검토한다.
- [x] 6. 새 관점의 코드 검토를 받고 필요한 수정을 검증한다. 최종 설치 버전·의존성 무결성·git diff와 소유 프로세스 종료를 확인해 결과와 한계를 보고한다.

## 검토 초점

- TypeScript 7이 실제 프로젝트와 build 타입 오류를 거부하고 도구 호환 경로가 이를 우회하지 않는지.
- 새 BlockNote/Mantine에서 기존 JSON/Markdown 로딩과 저장되는 HTML/Markdown/JSON, 이미지 업로드가 보존되는지.
- Tailwind/아이콘 업데이트가 desktop/mobile, light/dark, 모션 감소 상태의 표시와 접근성을 바꾸지 않는지.
- 공개 API fallback, 인증 토큰 갱신과 업로드 재시도, 오류/로딩/빈 상태의 기존 동작이 유지되는지.
- npm 트리에 invalid/extraneous 또는 직접 의존성의 미출시 버전이 포함되지 않는지.

## 진행 기록

- 시작: 범위와 로컬 격리 검증은 사용자의 현재 요청으로 승인되었다. 별도의 제품 설계 변경은 하지 않는다.
- 현재 조사: TypeScript 7은 컴파일러 API를 제공하지 않는다. Microsoft 공식 호환 alias와 Next `experimental.useTypeScriptCli` 지원을 확인했다. 설치 후 실제 소스/실패로 적합한 경로를 검증한다.

## 최종 구성과 결정

| 주 실행기/라이브러리 | 검증 버전 |
| --- | --- |
| Node.js / npm | 26.13.1 LTS / 12.2.2 |
| Next.js / eslint-config-next | 16.4.6 |
| React / React DOM | 19.3.1 |
| TypeScript native | 7.0.2 (`@typescript/native` alias) |
| Tailwind CSS / PostCSS adapter | 4.3.5 |
| ESLint 실행기 | 10.14.0 (`eslint10` alias) |
| BlockNote / Mantine | 0.57.0 / 9.8.0 |
| DOMPurify / Lucide / marked | 3.4.17 / 1.72.0 / 18.2.0 |
| PostCSS override | 8.5.32 |

나머지 애플리케이션 직접 의존성도 npm `latest`와 일치시켰다. 26개 직접 설치 항목의 실제 패키지명·alias·버전·역할과 PostCSS override는 `.verification/dependency-upgrade-20261113/summary.json`에 기록한다.

- **TypeScript 호환 결정:** `typescript`는 Microsoft가 제공하는 `@typescript/typescript6@6.0.2` API 호환 alias이고 실제 프로젝트 타입 검사는 native 7.0.2다. Next는 이 alias에서 컴파일러 경로를 선택하므로 실험 CLI flag를 쓰는 것만으로 native 7 검사가 되지 않는다. 실험 flag는 추가하지 않았고 일반 build와 isolated build에 native 7 선행 게이트를 넣었다. Next 자체 API 타입 검사도 유지했다. 개발/production 생성 타입을 포함한 최종 native 검사도 통과했다. [Microsoft 공식 병행 구성](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-60)
- **ESLint 호환 결정:** Next의 import·jsx-a11y·react 플러그인은 최신 안정판에서도 peer가 9까지다. 실제 lint 명령은 10.14.0 경로를 명시하고, `eslint` 이름의 9.39.5는 peer/API 호환용으로 남겼다. 공식 `@eslint/compat@2.1.1`이 기존 규칙을 연결한다. 9 자체는 지원 종료 버전이며 최신 실행기로 표현하지 않는다. 강제 설치/peer 범위 위조/규칙 제거 없이 tree를 정상화했다. [공식 호환 도구](https://github.com/eslint/rewrite/tree/main/packages/compat#readme), [지원 현황](https://eslint.org/version-support/)
- Lucide 1에서 없어진 브랜드 아이콘 네 개는 공식 0.539.0 아카이브의 동일 도형을 최신 `createLucideIcon`으로 구성하고 원본 ISC 라이선스를 보존했다. 이전 Lucide 패키지는 설치 의존성으로 남기지 않았다.
- Next 이미지 내부 API의 `allSizes` 계약을 테스트 설정에 반영했다. 기존 단언은 유지했다.
- Windows의 기존 `WATCHPACK_POLLING=true` 셸 문법은 `scripts/dev.js`로 옮겨 polling과 CLI 인자를 보존했다.
- 기존 인증 만료의 전체 페이지 이동은 관리자 상태를 폐기하는 동작이므로 유지하고, 새 린트 경고의 예외 이유를 해당 줄에 명시했다.

## 최종 검증

- 단위 **241/241**, ESLint 10 **오류 0·경고 0**, TypeScript native 7 검사 및 production build 통과.
- native 단독 검사·일반 build·isolated build가 모두 의도적 `TS2322` 소스 오류를 거부하는 것을 확인했다. 임시 파일을 제거한 뒤 정상 isolated build도 통과했다.
- npm 12.2.2의 lockfile 기반 `npm ci --ignore-scripts` 성공. 전체 `npm ls`에 invalid/extraneous/missing이 없다. 호환용 ESLint 9의 지원 종료 경고는 명시적으로 남는다.
- 기존 Next 규칙은 TSX **113개**, JS **90개**의 설정 값이 호환 wrapper 전후 동일했다. 실제 import·접근성·React 위반을 탐지하는 canary와 정상 코드 통과 테스트를 추가했다.
- 공개·관리자 smoke **57/57**, 기본 모션 **5/5**, 연결 모션 **13/13** 통과.
- 편집 회귀 **17/17**: desktop/mobile의 블로그·프로젝트 Markdown 가져오기, Markdown/HTML/text/JSON 저장, JSON 재진입, 로컬 multipart 이미지 업로드, 소셜 아이콘, 위험 HTML 정화 통과.
- 모바일 필터·목차 등 읽기 검사 **267개** 통과. 동일 초기 조회수로 비교한 목록 **8쌍**의 검색/필터/정렬/페이지 상태와 긴 본문 **8쌍**이 일치한다.
- 전후 화면 **56개**의 크기가 모두 동일했다. RGB 차이 8/255 초과 픽셀을 가리지 않고 비교한 최대 차이는 **0.0241%**였으므로 픽셀 완전 동일로 주장하지 않는다. 첫 카드 위치도 유지됐다.
- 실제 Windows `npm run dev`의 hostname/port/webpack 인자 전달, 로그인 페이지 및 홈 SSR을 확인했다.
- 독립 읽기 전용 코드 검토에서 기존 peer 충돌 해소와 중요 미해결 결함 없음을 확인했다.

## 검증 도구에서 발견한 사항

- 기존 reading 도구의 `before`는 과거 모바일 필터/목차 구현 전 화면을 기대했다. 이번에는 두 단계 모두 현재 기능을 검사하도록 무시된 검증 wrapper만 바꿨다. 제품 동작을 바꾸어 통과시키지 않았다.
- 추가 반복 편집은 모의 API가 태그 이름을 그대로 저장해 다음 편집의 메타데이터가 사라지는 문제를 드러냈다. 알려진 태그 이름을 기존 객체로 복원하는 fixture 보완을 실제 실패하는 회귀 테스트와 함께 적용했다. 실제 편집기 제품 코드는 변경하지 않았다.
- 화면 비교는 smoke의 조회수 증가 영향을 받으므로 전후 reading 비교는 새 fixture의 같은 초기 상태로 맞췄다. 본문과 정렬 결과를 임의로 정규화하지 않았다.

## 증거와 한계

전체 근거는 `.verification/dependency-upgrade-20261113/summary.json`, `targets.json`, `typecheck-safety.json`, `npm-ls-final.json`, `lint-config-parity.json`, `screen-comparison.json`, 각 phase의 report/log에 보존한다. 합성 메모리 API를 사용한 로컬 Windows 검증으로, 실제 백엔드·DB·배포 환경 검증은 아니다. Node 런타임은 프로젝트 검증 폴더 안에 있으며 전역 nvm/npm 설정을 변경하지 않았다. `.nvmrc`와 package metadata에 사용할 버전을 기록했다.

Dev/Live에 접속하지 않았고 런타임의 외부 HTTP/WebSocket 시도는 없었다. 검증용 소유 프로세스는 종료했으며 최종 cleanup에서 앱·API 모두 응답하지 않았다. 초기 결과는 미커밋 상태로 검토했고, 이후 사용자가 병행 구성을 유지한 커밋을 명시적으로 요청했다. 커밋 직전에 전체 단위 테스트 241개를 다시 실행해 모두 통과한 것을 확인했다.
