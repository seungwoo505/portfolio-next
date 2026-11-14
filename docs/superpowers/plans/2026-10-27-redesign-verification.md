# 리디자인 검증 결과

2026-10-27, `D:\portfolio-next`, `codex/portfolio-redesign` 브랜치의 커밋 전 작업 트리에서 수행했다.

## 변경

- Spotlight의 실제 Container 소스를 프로젝트에 맞게 통합하고 공개 헤더·푸터·홈·소개·프로젝트·블로그·연락·설정을 공통 Zinc/Teal 디자인으로 재구성했다.
- Catalyst의 실제 Button, Link, Heading, Text, DescriptionList 소스를 통합했다. 링크는 Next Link로 연결하고 관리자·로그인·폼·설정에서 사용한다.
- 프로젝트/글 조회수, 검색/다중 필터/정렬/페이지 이동, 상세 slug와 메타데이터, HTML 정화, 인증과 관리자 CRUD 및 편집기를 유지했다.
- 검색/필터 결과의 페이지 이동을 복원하고 순차 공개 대기를 제거했다. 홈의 객체 형태 기술 데이터 렌더링과 저장소 사용 불가 시 테마 전환을 회귀로 검증했다.
- 과도한 전역 dark 덮어쓰기를 제거하고 토큰, class dark, reduced-motion, 포커스와 본문 바로가기를 정리했다. 원격 폰트 요청을 제거했다.

## 확인한 결과

| 검증 | 결과 |
|---|---|
| node:test 전체 | 54/54 통과 |
| ESLint 전체 | 통과, 오류/경고 없음 |
| TypeScript `--noEmit` | 통과 |
| 격리 production build | webpack 컴파일·타입 확인·30개 정적 페이지 생성 성공 |
| Playwright 전체 | 57/57 통과 |
| 브라우저 외부 요청 시도 | 0건 |
| 브라우저 미처리 오류 | 0건 |
| Git diff 공백 검사 | 통과 |
| 독립 코드 리뷰 | 발견 2건 수정 후 남은 수정 필요 사항 0건 |

브라우저는 공개 8개 경로를 desktop/mobile × light/dark 32개 조합으로 확인했다. 검색·복수 필터·정렬·페이지 이동·문의 전송·테마 유지·실패/로딩/폼 비활성·모바일 메뉴를 검증했다. 관리자 12개 화면 읽기, 태그 생성/취소/수정/삭제, 데스크톱 다크 및 모바일 라이트/다크의 메뉴·글/프로젝트 편집기·로그아웃도 확인했다. 각 캡처에서 가로 넘침을 검사했으며 홈·목록·연락·관리자 캡처를 시각 점검했다.

## 격리와 범위

Dev 및 Live 서버에는 접속하지 않았다. 세 API 주소는 `127.0.0.1:4319`, 앱은 `127.0.0.1:4318`에 고정했다. 서버 TCP/DNS/fetch와 브라우저 외부 경로를 차단했다. Chrome은 사용자의 원래 프로필과 분리된 임시 headless 프로필을 사용했다. fixture 데이터와 저장/조회수/삭제는 로컬 메모리에서만 처리했다.

이 결과는 로컬 fixture 계약과 UI 동작의 검증이다. 실제 운영 데이터, 운영 API 또는 운영 인프라 동작을 검증했다는 의미가 아니다. 격리 설정으로 생성한 `.next`는 검증 전용이며 배포하지 않는다.

Node 26의 기존 localStorage ExperimentalWarning과 빌드 도구의 module.register DeprecationWarning은 실행 로그에 남는다. 테스트/타입/린트/빌드 실패는 없다.

## 산출물과 실행

- 상세 브라우저 보고서: `.verification/isolated-smoke/report.json`
- 화면 캡처: `.verification/isolated-smoke/*.png`
- 단위 테스트 로그: `.verification/unit-tests.log`
- 리뷰 보고서: `.verification/redesign-final-review.md`
- 로컬 프로세스 기록: `.verification/isolated-preview-processes.json`
- 실행·종료 방법: `docs/superpowers/plans/2026-10-27-isolated-preview.md`

커밋·푸시·병합·배포는 하지 않았다. 현재 브랜치의 작업 내용을 유지했다.

## 연결 모션 추가 검증

2026-10-27 같은 브랜치에서 메뉴 표시, 카드 재배치, 문의 상태, Hero SVG 선, 프로젝트 이미지 목록/홈→상세 연결을 추가했다. 전체 회귀 92/92, 기존 기능 브라우저 57/57, 기본 모션 5/5, 신규 연결 모션 13/13이 통과했다. 전체 ESLint·TypeScript·외부 차단 production build·공백 검사도 통과했다. 실제 이미지 380ms 재생과 목적 위치 일치를 desktop/home/mobile에서 기록했다. 세 브라우저 보고서 모두 외부 요청 시도와 미처리 오류는 0건이다.

독립 리뷰에서 발견한 탐색 취소 경합 1건은 DOM/브라우저 RED 후 수정했으며 재리뷰의 추가 지적은 없다. 자세한 검증 범위와 기존 native Back의 필터 상태 제한은 `2026-10-27-connected-motion.md`에 기록했다. 이미지 모서리 조정 뒤 최종 빌드와 연결 모션 13개를 확인했으며, 기존 기능 57개는 해당 시각 조정 직전에 통과했다. Dev/Live 접속·커밋·푸시·배포 없이 로컬 fixture 검증만 수행했다.

## 전체 화면 시각 감사 및 보완

2026-10-27 사용자의 전체 페이지 직접 확인 요청에 따라 공개 8개 화면, 관리자 로그인, 관리자 실제 경로 17개(목록·설정·프로젝트/글 신규 및 수정·사용자 수정 포함), 총 26개 화면을 점검했다. 데스크톱 1440×1000 light/dark 캡처와 직접 브라우저 이동, 모바일 390×844·320×844 캡처를 사용했다. 아래 콘텐츠까지 스크롤하고 이미지 연결 0/190/380ms, 프로젝트 및 블로그 카드 재배치 0/120/240ms 프레임을 시각 점검했다. 추가로 404 화면도 desktop 및 모바일 양쪽 폭에서 확인했다.

### 발견 및 수정

- 모바일 메뉴가 열린 상태에서 로고 또는 native Back으로 경로를 바꾸면 메뉴가 남던 문제: pathname 변경 시 layout effect에서 닫는다. DOM 회귀 RED→GREEN 및 실제 브라우저의 로고/Back 닫힘을 확인했다.
- OS 또는 앱의 감소 모션 상태에서도 pagination이 약 0.8~1초 동안 긴 smooth scroll을 실행하던 문제: 프로젝트/블로그가 공통 page-scroll helper를 사용해 instant로 이동한다. 일반 smooth 동작은 유지한다. 실제 scrollTo 인자, 동기 반환 직후 및 다음 프레임 y=0을 확인했다.
- 원본 hover scale 1.015가 이미지 연결 시작 순간 clone의 none으로 바뀌던 문제: 현재 scale을 복사하고 상세 이미지 scale까지 외곽 이동과 같은 380ms 동안 연결한다. 하위 애니메이션도 취소/완료 시 정리한다. 실제 브라우저 source/clone scale 일치를 확인했다.
- 아래 카드의 진입 380ms 도중 필터 FLIP 240ms가 같은 transform에 겹치던 문제: 진입 애니메이션에 생산용 식별자를 부여하고 위치 측정 전 해당 진입만 취소한다. 다른 모션과 진행 중 FLIP의 현재 위치는 유지한다. 실제 두 컨트롤러 통합 회귀 RED→GREEN과 브라우저에서 진입 관측 true / transform 경합 false를 확인했다.
- 관리자 tags/personal-info/experiences/interests/users의 버튼 글자 분절과 좁은 카드 본문: 모바일 세로 배치·간격·버튼 nowrap으로 정리하고 sm 이상 가로 배치를 유지한다. users/edit의 390→465px 가로 넘침은 요약 정보 줄바꿈으로 해결했다. 마지막 320px 점검에서 남아 있던 사용자 역할/상태 필터의 세로 분절과 사용자명이 배지에 밀리던 문제도 별도 행 배치로 해결했다. 최종 390 light / 320 dark에서 버튼 텍스트 Range와 문서 폭을 확인하고 캡처를 직접 재검토했다.
- 소개 화면에 보인 HTML 태그는 textarea 계약에 잘못 넣은 합성 fixture 문자열이었다. 로컬 about 검증 데이터만 일반 텍스트로 정리했다. 제품 HTML 렌더링 계약은 변경하지 않았다.

### 최종 확인 결과

| 검증 | 결과 |
|---|---|
| 전체 node:test | 105/105 통과 |
| 전체 ESLint | 통과 |
| TypeScript 및 최종 격리 production build | 통과, 30개 정적 페이지 생성 |
| 기존 화면·기능 브라우저 | 57/57 통과 |
| 기존 기본 모션 브라우저 | 5/5 통과 |
| 기존 연결 모션 브라우저 | 13/13 통과 |
| 이번 최종 시각 회귀 | 22/22 통과 |
| 네 브라우저 회귀 보고서의 외부 요청 / 미처리 오류 | 모두 0 / 0 |
| 추가 블로그 중간 프레임 | 6개 캡처, 오류·외부 요청 0 |
| 모바일 404 | 390·320 모두 HTTP404, 가로 넘침 없음 |
| 독립 검토 | root의 이미지·메뉴·스크롤 변경에서 추가 지적 없음, 관련19개 독립 실행 통과 |

마지막 사용자 목록 CSS 보완 뒤 최종 build/lint와 시각 회귀 22개를 다시 실행했다. 기능 57개·기본 모션 5개·연결 모션 13개는 해당 마지막 CSS 보완 직전 빌드에서 통과했다. 스크린샷 생성용 `.verification`은 Git 및 ESLint 대상에서 제외했다. 기존 API/저장/권한/검증 로직은 변경하지 않았다.

최초 감사 도구의 404 main 요구 및 없는 블로그 필터 선택으로 생긴 캡처 실패는 제품 오류로 분류하지 않았다. body 기반 404 캡처 및 실제 블로그 필터로 보완 실행했다. 원본 감사 보고서를 보존하고 최종 성공 보고서를 별도로 남겼다.

### 증거와 범위

- 원본 desktop 감사: `.verification/visual-audit-desktop/report.json`, PNG, contact-light/dark 시트
- 원본 mobile 감사: `.verification/visual-audit-mobile/report.json`, PNG
- 최종 성공 회귀 및 캡처: `.verification/visual-audit-final/report.json`, PNG
- 변경 전 scale/transform 경합: `.verification/visual-audit-final/baseline-characteristics.json`
- 추가 블로그/404: `.verification/visual-audit-desktop/blog-report.json`, `.verification/visual-audit-mobile/404-report.json`
- 독립 검토: `.verification/visual-audit-final/review.md`

모바일은 Chrome의 브라우저 viewport/device emulation이며 실제 휴대전화나 Safari 결과가 아니다. 필터/검색/페이지가 상세 Back에서 기본값으로 돌아오는 기존 동작은 유지했다. 실제 운영 콘텐츠·서버 동작을 확인한 결과가 아니며 Dev/Live 직접 접속, 커밋, 푸시, 배포는 하지 않았다. `codex/portfolio-redesign` 브랜치와 로컬 fixture 미리보기를 유지했다.
