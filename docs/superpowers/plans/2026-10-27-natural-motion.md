# 자연스러운 모션 추가 계획

사용자 승인: 기존 리디자인에 섹션 진입, 카드, 버튼, 모바일 메뉴의 모션을 추가하며 자연스러움을 우선한다. 브랜치 `codex/portfolio-redesign`, Dev/Live 접속 금지 및 로컬 격리 검증 제약은 그대로 유지한다.

- [x] `src/lib/site-motion.ts`와 `src/components/site/SiteMotion.tsx`: 기본 콘텐츠는 항상 보인다. 최초부터 보이는 요소는 다시 나타나지 않으며, 아래에 있던 `data-reveal` 요소만 첫 진입 시 8px/380ms 모션을 적용한다. 새 결과가 이미 보이는 위치에 추가될 때는 160ms 불투명도만 사용한다. 대기·순차 데이터 렌더링은 추가하지 않는다.
- [x] 실제 controller 동작 회귀를 먼저 작성한다: 최초 visible/지원 없음/감소 모션에는 animation 없음, 관찰한 요소는 한 번만, 동적 추가/포커스/실시간 감소 모션/cleanup에 안전.
- [x] 공개 레이아웃과 홈/목록의 명시적 부착 지점에만 controller를 연결한다. 서로 겹치는 부모·자식에 동시에 적용하지 않는다.
- [x] CSS 카드·화살표·버튼은 160~360ms의 부드러운 ease-out, 1~2px 및 이미지 1.015배 이내로 제한한다. 실제 hover 포인터에서만 hover 이동한다.
- [x] 모바일 메뉴는 grid 행 크기로 220ms 펼침/닫힘을 적용하고 닫힌 메뉴는 inert/aria-hidden으로 즉시 탐색에서 제외한다. 감소 모션에서는 즉시 전환한다.
- [x] 전체 회귀/린트/타입/격리 build를 확인하고, 독립 코드 리뷰와 로컬 브라우저에서 실제 모션·빠른 스크롤·감소 모션·키보드·메뉴·기존 주요 기능을 검증한다.

최초 화면은 읽기 전에 투명해지는 현상을 피하도록 별도 등장 대기나 전체 화면 애니메이션을 넣지 않는다. 시각 조정은 데이터를 바꾸지 않는다. 커밋·푸시·배포하지 않는다.

## 최종 검증

- 실제 controller 회귀 7개를 실패 재현 후 통과시켰다. 전체 node:test 61개 통과.
- 전체 ESLint, TypeScript, 공백 검사 통과. 외부 차단을 유지한 production build 성공.
- 기존 공개·관리자 브라우저 57개 통과. 모션 전용 실제 브라우저 5개 통과: 8px/380ms 진입, 재진입 시 반복 없음, 감소 모션에서 호출 없음, JS 비활성에서도 가시성, 모바일 메뉴 inert/Tab/Escape 포커스 복귀.
- 독립 scoped 코드 리뷰의 수정 필요 사항 없음. 로컬 fixture만 사용했으며 Dev/Live 접속·커밋·푸시·배포 없음.
- 보고서: `.verification/isolated-motion/report.json`, `.verification/natural-motion-review.md`, `.verification/isolated-smoke/report.json`.
