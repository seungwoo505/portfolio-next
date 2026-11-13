# 공개 페이지 로딩 최적화 및 전후 비교

승인된 범위: 1) 관리자 에디터 CSS 분리 2) 이미지 크기/포맷 최적화 3) 프로젝트 설정 대기를 목록 로딩에서 분리. 디자인·기능·자연 모션을 유지하며 Dev/Live 접속 없이 로컬 합성 API만 사용한다. 현재 codex/portfolio-redesign, 기준 HEAD 3960e6b에서 진행한다. 기존 docs와 검증 기록을 보존하며 커밋·푸시는 하지 않는다.

## 비교 기준
- 같은 Node/Next 의존성, production webpack build, 127.0.0.1 앱 4318/API 4319, 서버 TCP/DNS/fetch와 브라우저 HTTP/WebSocket 외부 차단, 임시 Chrome 프로필.
- 기준 제품 코드는 수정하지 않고 먼저 도구만 준비한다. 합성 JPEG는 로컬에서 생성하고 before/after 모두 동일 파일을 사용한다. API/글/프로젝트는 메모리 fixture이며 실제 내용이 아니다.
- before → css → images → after 단계별 build/capture. 공개 8경로, desktop1440×1000/mobile390×844 light/dark; 텍스트·색·레이아웃·본문 표/목록/이미지와 에디터 비교.
- CSS는 홈 및 공개 경로 stylesheet raw/gzip 총량. 이미지 bytes/type/currentSrc/naturalWidth/표시영역과 최적화 endpoint를 기록한다. 실제 운영 속도로 외삽하지 않는다.
- 목록은 API 목록100ms/설정500ms 고정 지연과 동일 데이터로 5회 반복해 요청 시작 간격과 카드 첫 표시의 중앙값을 비교한다.

## Task 1 CSS
root layout의 BlockNote 두 CSS import를 실제 editor dynamic boundary로 옮긴다. 공개 HTML이 필요한 CSS는 최소한만 유지한다. public BlockNote export의 표/목록/이미지/정렬/색과 관리자 편집·업로드를 검증한다. CSS 문자열을 검사하는 단위 테스트 대신 실제 빌드 asset/브라우저 style 및 screenshot 비교를 사용한다.

## Task 2 이미지
전역 unoptimized를 해제하되 기존 임의 외부 URL, SVG/GIF/data/blob 호환성을 유지한다. 신뢰할 수 있는 명시된 origin의 raster와 상대 raster를 최적화하고 미지원 remote는 직접 로딩한다. shared policy를 config와 컴포넌트에 같이 사용해 allowlist 불일치를 막는다. loopback 최적화와 private IP 허용은 격리 flag일 때만 가능하다. 기존 이미지 fallback·마커·hover crop·공유 전환·native Back을 유지한다. 정책 및 actual Next image props 회귀 RED/GREEN, 실제 JPEG bytes/포맷 비교.

## Task 3 목록
설정 조회를 목록 조회와 독립 실행해 GitHub 링크 설정이 느리거나 실패해도 카드 표시를 기다리지 않게 한다. 전체 목록/초성 검색/OR 필터/정렬/페이지 이동/에러·로딩 의미를 유지한다. 설정 대기와 실패 시 실제 컴포넌트 상태 회귀 RED/GREEN과 고정 지연 browser timing 비교.

## 최종 게이트
전체 unit, ESLint, TypeScript, 격리 build. 기존 smoke/basic motion/connected motion 및 전후 performance report. 결과에서 가설과 실제 측정, cold/warm 및 합성 환경 한계를 구분한다. 이번 작업의 프로세스만 종료하고 최종 diff와 미커밋 상태를 기록한다.
## 구현 및 전후 비교 결과 (2026-11-02)

관리자 에디터 CSS를 동적 경계로 옮기고 공개 본문의 정렬 규칙은 유지했다. 신뢰 origin의 raster만 Next 이미지 최적화를 사용하며 unknown origin, SVG/GIF, data/blob은 기존 원본 표시를 유지한다. 프로젝트 설정은 목록 조회와 독립 실행한다. 기존 디자인, 검색, 필터, 정렬, 페이지네이션과 연결 모션은 유지했다.

| 항목 | 적용 전 | 적용 후 |
|---|---:|---:|
| 홈 CSS 원문 | 333,632 B | 114,033 B |
| 홈 CSS gzip 계산값 | 56,310 B | 19,983 B |
| 목록 합성 JPEG 이미지 | 440,185 B | AVIF 5,771 B, 요청 폭 640px |
| 데스크톱 상세 합성 이미지 | 440,185 B | AVIF 12,931 B, 요청 폭 1200px |
| 목록 카드 표시 중앙값 | 646.4~652.8 ms | 130.1~138.4 ms |

목록 시간은 첫 projects 요청부터 카드 표시까지 프로필별 5회씩 측정했다. 목록100ms, 설정500ms 지연을 전후 동일하게 적용했다. 서버 캐시가 재사용될 수 있으며 합성 이미지와 고정 지연 수치를 운영 속도로 해석하지 않는다. gzip은 압축 계산값이다.

공개 8경로 × desktop/mobile × light/dark 32사례의 텍스트·스타일·배치·이미지 원본 식별과 HTTP200 비교가 통과했다. 좌표 허용오차는0.5px이고 동적 조회수만 정규화했다. CSS 중간 단계의 표 정렬 우선순위 차이는 원본 !important를 복원해 수정했고 원본 중간 보고서도 보존했다. Footer도 설정을 요청하므로 raw request의 마지막 settings 요청을 사용해 전후 간격을 동일하게 계산했다.

전체 단위192개, 기능57개, 기본 모션5개, 연결 모션13개 및 production webpack build, ESLint, TypeScript, diff 검사가 통과했다. 관리자 편집기와 모바일 캡처를 확인했다. TCP/DNS/fetch 및 브라우저 외부 통신을 차단한 로컬 fixture만 사용했고 Dev/Live에 접속하지 않았다. 검증용 소유 프로세스와4318/4319 리스너를 모두 종료했다.

상세 근거는 로컬 `.verification/performance/{before,css,images,after}/report.json`, `comparison.json`, `summary.md`에 남긴다. 이 산출물과 PNG는 기존 Git 제외 규칙을 유지한다. 도구는 `scripts/isolated-performance-fixture.js`, `scripts/isolated-performance.js`, `scripts/isolated-performance-compare.js`로 재현한다. 변경 전 제품 baseline은3960e6b다.

## 커밋 승인 (2026-11-13)

사용자가 이번 최적화와 Markdown 포함 커밋을 승인했다. 제품 최적화 세 가지, 비교 도구, 문서를 목적별로 나누고 작성자·커미터 시간을 모두2026-11-13T19:27:34+09:00으로 지정한다. 위의 커밋·푸시를 하지 않는다는 초기 범위와 이전 문서의 미커밋 표기는 각 문서 작성 당시의 작업 상태다. 이번 요청은 로컬 커밋까지이며 푸시는 별도다.