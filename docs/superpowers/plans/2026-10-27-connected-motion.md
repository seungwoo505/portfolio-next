# 연결 모션 구현 계획

2026-10-27 사용자 승인: 현재 codex/portfolio-redesign 브랜치에서 메뉴 활성 표시 이동, 카드 재배치, 실제 전송 상태 연결, 홈 SVG 선 1회 그리기, 프로젝트 이미지 목록→상세 연결을 추가한다. 기존 기능 유지, 자연스러움, Dev/Live 접속 금지 및 로컬 격리 검증 제약은 그대로다.

## 파일과 인터페이스

1. Header.tsx + HomeHeroSection.tsx + 전용 CSS: 메뉴 표시 180ms, 홈 장식 선 650ms 1회. 실제 활성 경로와 모바일/키보드/감소 모션 유지.
2. AnimatedList.tsx + list-motion.ts + tests/list-motion.test.cjs: `AnimatedList({items: readonly string[], className?, children})`. 자식의 `data-layout-id`로 기존 위치와 새 위치를 연결한다. `data-layout-animating` 컨테이너 표식으로 기존 진입 효과와 중복을 피한다. 위치 이동만 240ms, 실제 데이터/순서는 즉시 반영한다.
3. contact/page.tsx + 전용 상태 CSS/회귀: 실제 API 응답에만 success, pending 중 중복 전송 금지, 오류 입력 보존, 다음 입력 시 상태 초기화. 기존 payload/toast 유지.
4. ProjectCoverImage.tsx + project-image-transition.ts + ProjectTransitions.tsx + 프로젝트 링크/상세/홈 연결: Next Link와 라우터의 기본 이동을 보존하는 DOM overlay 전환. 완전히 로드된 실제 이미지에만 적용한다. modifier/new-tab/외부 링크와 감소 모션에는 기본 동작. 목적 이미지가 준비되지 않거나 취소되면 즉시 정리하고 기본 탐색을 유지한다. 뒤로가기에서는 원래 스크롤 복원을 방해하지 않는다. 프레임워크 업그레이드/experimental 플래그 없이 구현한다.
5. 행동 회귀를 먼저 작성해 실패를 확인하고 구현한다. 전체 node:test/ESLint/TypeScript/격리 production build를 실행한다. 로컬 차단 브라우저로 기존 조작과 새 모션, 실패/취소/감소 모션/뒤로가기/스크롤/키보드를 검증하고 독립 리뷰한다.

## 공유 규칙

공통 globals.css 및 package.json은 루트만 수정한다. 컴포넌트별 추가 CSS는 각 담당 파일에 별도 import할 수 있다. task별 파일 소유권을 분리하고 기존 미커밋 변경을 유지한다. 새 라이브러리나 프로덕션 데이터 변경은 필요 없다. 커밋·푸시·배포하지 않는다.

## 진행

- [x] 메뉴 표시와 Hero 선
- [x] 카드 재배치와 문의 상태
- [x] 프로젝트 이미지 연결
- [x] 회귀·격리 빌드·브라우저·리뷰
## 최종 결과

- 메뉴 활성 배경은 실제 링크 위치로 180ms 이동한다. 첫 위치와 리사이즈는 즉시 보정한다.
- 프로젝트·블로그의 유지된 카드만 240ms 재배치한다. 새 항목과 실제 데이터 변경을 기다리게 하지 않는다.
- 문의 버튼은 실제 API의 pending/success/error와 연결한다. 중복 전송을 차단하고 실패 입력을 보존한다.
- 홈 도식 SVG 선은 desktop에서 650ms 1회 그린다.
- 홈 대표 프로젝트와 프로젝트 목록의 로드된 실제 이미지가 상세 이미지의 위치·크기·둥근 모서리로 380ms 연결된다. Next Link, native history, 새 탭 동작은 그대로 사용한다.
- OS 및 앱의 감소 모션, 키보드 포커스, 리사이즈와 탐색 취소에 맞춰 움직임을 정리한다. 느린 이미지·실패 시 기본 탐색을 유지한다.

## 검증 결과 (2026-10-27)

| 검증 | 결과 |
|---|---|
| 전체 node:test | 92/92 통과 |
| 전체 ESLint | 통과 |
| TypeScript | 독립 --noEmit 및 최종 production build 모두 통과 |
| 외부 차단 격리 production build | 성공, 30개 정적 페이지 생성 |
| 기존 화면·기능 브라우저 | 57/57 통과 |
| 기존 기본 모션 브라우저 | 5/5 통과 |
| 신규 연결 모션 브라우저 | 13/13 통과 |
| 실제 공유 이미지 재생 | 목록 desktop, 홈 desktop, mobile에서 각 380ms·running·목적 좌표 일치 |
| 외부 요청 시도 / 미처리 브라우저 오류 | 세 보고서 모두 0 / 0 |
| 독립 코드 리뷰 | 탐색 취소 경합 1건 수정 후 관련 회귀 9/9, 추가 지적 없음 |
| 공백 검사 | 통과 |

헤더 이동이 상세 로딩보다 먼저 끝날 때 overlay가 남던 문제는 DOM 및 실제 브라우저에서 RED를 확인한 후 수정했다. document capture에서 즉시 취소하고 다른 URL 확정도 확인하며, 오래된 타이머/완료 콜백은 새로운 전환을 지우지 않는다. 관련 5개 행동 회귀를 보존했다.

검증 중 기존 프로젝트 페이지는 필터를 URL/history/session에 저장하지 않는 것을 HEAD 및 현재 소스에서 확인했다. 따라서 native Back은 기존 기본 목록과 카드 영역 복귀를 검증하며, 기존에 없던 필터 복원 기능을 구현하거나 보장하지 않는다. 필터·검색·정렬·페이지 이동은 별도 회귀에서 통과했다.

검증 데이터와 계정은 로컬 fixture만 사용했다. Dev/Live에는 접속하지 않았으며 운영 데이터·실제 API 동작의 검증 결과가 아니다. 브라우저는 사용자 프로필과 분리했다. 새 패키지를 추가하지 않았다. 커밋·푸시·병합·배포하지 않고 codex/portfolio-redesign 브랜치에 변경을 남겼다.

## 증거 및 미리보기

- 연결 모션: `.verification/isolated-connected-motion/report.json` (재생 시간·출발/도착 좌표 포함)
- 기존 모션: `.verification/isolated-motion/report.json`
- 기존 기능/화면: `.verification/isolated-smoke/report.json` 및 PNG
- 독립 리뷰: `.verification/connected-motion-review.md`
- 현재 격리 미리보기: `http://127.0.0.1:4318` / fixture API `http://127.0.0.1:4319`
- 실행·종료: `docs/superpowers/plans/2026-10-27-isolated-preview.md`
