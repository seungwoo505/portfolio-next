# 후속 개선 세 가지 적용 및 검증

2026-10-28, `D:\portfolio-next`, `codex/portfolio-redesign` 브랜치의 미커밋 작업 트리에서 진행했다. 앞선 추가 감사의 미적용 항목 세 가지를 모두 적용했다.

## 관리자 팝업과 모바일 메뉴

- ConfirmModal, NewUserModal, TagModal, SkillModal을 기존 설치된 Headless UI Dialog/Panel/Title로 연결했다. 기존 초기 입력 포커스를 유지하고 Tab/Shift+Tab 순환, 배경 inert/aria-hidden, Escape·닫기·바깥 클릭 후 실행 버튼 복귀와 스크롤 잠금을 적용한다.
- 수동 document Escape 리스너와 body overflow를 unset으로 덮는 처리를 제거했다. 저장 중에는 기존 닫힘 차단을 유지하고 Skill의 연속 저장/숙련도 0 계약을 보존했다.
- 포털에서도 기존 관리자 CSS 범위와 밝은/어두운 패널 색상을 유지한다.
- AdminSidebar는 데스크톱 일반 aside, 모바일 Dialog로 표시한다. 모바일은 닫기 버튼에 초점을 두고 200ms 이동과 감소 모션 대응을 유지한다. 메뉴 링크·native Back·1024px 전환 시 닫히고 모바일 폭으로 돌아와도 자동으로 열리지 않는다.
- 브라우저 감사에서 모바일에만 배경 inert가 빠지는 초기화 순서를 발견했다. 모달을 닫힌 상태부터 Dialog에 연결해 main tree가 열리기 전에 준비되도록 수정했다. 라이브러리가 닫힌 DOM을 제거하므로 닫힌 폼은 화면이나 키보드 탐색에 나타나지 않는다. 메뉴 Dialog의 바깥 영역도 fixed inset-0으로 잡았다.
- 초기 실패는 `initial-report.json`, 최종 성공은 `report.json`에 보존했다. 실제 350ms 후 DOM으로 배경 inert를 비교한 `focus-diagnostic.json`도 남겼다.

## 상세 조회 오류와 재시도

- `server-fetch.ts`의 ServerFetchError는 HTTP 상태를 보존한다. primary/fallback 모두 실제 404일 때만 부재로 처리하고, 앞선 503·연결 실패·JSON 오류를 뒤의 404로 덮지 않는다.
- 프로젝트/블로그 상세 loader는 실제 HTTP 404만 notFound로 보낸다. HTTP200 success:false, 성공 응답의 data 부재, timeout, JSON 오류 등은 오류 경계로 전달한다.
- 기존 성공 캐시 300초, primary 1500ms/fallback 5000ms 제한 및 공개 API fallback을 유지한다.
- 두 상세 경로에 오류 화면을 추가했다. 오류 원문이나 내부 API 주소를 사용자에게 노출하지 않고 다시 시도 및 목록 이동을 제공한다.
- 재시도는 검증된 프로젝트/블로그 상세 경로의 캐시만 revalidatePath로 무효화한 뒤 RSC를 갱신하고 경계를 reset한다. 요청 중 중복 클릭을 막고 캐시 무효화 실패는 다시 시도할 수 있게 안내한다. HTTP200 실패 응답이 Data Cache에 남은 경우도 복구되는 것을 실제 production 모드에서 확인했다.
- 실제 브라우저에서 프로젝트/블로그 각각 503 1회·4회, HTTP200 success:false 1회·2회를 주입했다. 한 번의 재시도 뒤에도 오류가 남는 경우 버튼이 다시 활성화되고 두 번째 재시도로 본문이 복구됨을 확인했다. 오류 제어는 로컬 합성 API의 토큰이 필요한 검증 전용 경로이며 제품 API에 추가하지 않았다. 원본 글/프로젝트와 장애 설정은 모두 복원했다.
- 최초 503 2회 주입은 Next server action 응답의 RSC 갱신과 router.refresh로 이미 복구되어 검사 자체의 오류 화면 대기가 실패했다. 실제 연속 오류를 남기도록 4회로 강화했다. 정상 복구를 제품 오류로 분류하지 않았다.

## 공유 이미지 주소

- 프로젝트 화면에서 쓰던 normalizeImageUrl을 상세 OpenGraph/twitter/JSON-LD/mainEntity.screenshot에도 적용했다.
- GitHub blob/raw 주소는 실제 raw 이미지로 정규화하고 상대 경로는 사이트의 절대 URL로 만든다. data URL이나 이미지 부재는 공유 메타데이터의 기본 이미지로 대체하고 해당 JSON-LD 이미지 항목은 생략한다.
- 외부 이미지 URL의 검증은 로컬 SSR HTML만 읽어 수행했다. GitHub·raw 이미지·운영 사이트·실제 공유 크롤러에 접속하지 않았다.

## 확인 결과

| 검증 | 결과 |
|---|---|
| 전체 단위 테스트 | 152/152 통과 |
| 전체 ESLint | 오류·경고 0, 종료 0 |
| TypeScript 및 최종 격리 production build | 통과, 정적 페이지 30개 생성 |
| 신규 포커스·메뉴·오류 재시도 브라우저 | 90/90 통과 |
| SSR 공유 메타데이터·실제 없는 두 문서 HTTP404·합성 데이터 복원 | 6/6 통과 |
| 기본 모션 브라우저 | 5/5 통과 |
| 연결 모션 브라우저 | 13/13 통과 |
| 기존 공개·관리자 기능 브라우저 | 57/57 통과 |
| 신규 QA 외부 HTTP/WebSocket 시도·예상 밖 미처리 브라우저 오류·예상 밖 API 쓰기 | 모두 0 |
| 신규 QA 합성 상세 원본 복원 | 8/8 통과 |
| 공백 검사 | 통과, 기존 CRLF 안내만 존재 |

화면은 데스크톱 1440×1000, 모바일 390×844 및 메뉴 1024px 경계에서 밝은/어두운 테마를 검사했다. 네 모달의 초기 초점, 앞뒤 Tab 순환, 배경의 프로그램적 focus 차단, Escape·버튼·바깥 클릭 후 복귀를 모두 확인했다. 가짜 지연 삭제를 사용해 실제 데이터 삭제 없이 busy 닫힘 차단을 확인했다. 테마/패널 화면도 직접 시각 점검했다.

신규 SSR 장애 주입에서 발생하는 의도된 서버/브라우저 console 오류는 보고서에 증거로 남겼다. 이를 정상 화면 오류로 계산하지 않는다. 실제 서버 장애나 사용자 데이터를 대상으로 한 결과는 아니다. 단위 테스트에는 Node26의 기존 localStorage ExperimentalWarning 두 건이, 빌드에는 module.register DeprecationWarning이 남는다.

## 산출물 및 범위

- `.verification/remaining-improvements/report.json`, PNG: 신규 브라우저 QA
- `.verification/remaining-improvements/metadata-report.json`: 로컬 SSR 메타데이터 및 404
- `.verification/remaining-improvements/unit-tests.log`: 전체 단위 테스트
- `.verification/isolated-smoke/report.json`, `isolated-motion/report.json`, `isolated-connected-motion/report.json`: 기존 기능과 모션
- 신규 회귀: `tests/admin-navigation.test.cjs`, `admin-modal-contract.test.cjs`, `detail-server-errors.test.cjs`, `detail-retry.test.cjs`, `project-seo-images.test.cjs`, `isolation.test.cjs`의 장애 제어 검사

로컬 앱 127.0.0.1:4318과 메모리 합성 API 127.0.0.1:4319만 사용했다. 서버 TCP/DNS/fetch 및 임시 Chrome의 HTTP/WebSocket과 프록시로 외부 통신을 차단했다. 사용자 원래 브라우저 프로필과 실제 모바일 기기는 사용하지 않았다. Dev/Live 접속, 외부 백엔드 API/DB 변경, 커밋·푸시·병합·배포는 하지 않았다. `.next`는 fixture 환경변수로 만든 로컬 검증 전용이다.
최종 빌드에서 브라우저 165개와 로컬 HTTP/메타데이터 6개, 총 171/171 검사가 통과했다. 네 브라우저 보고서 모두 외부 요청 시도와 예상 밖 미처리 브라우저 오류는 0이다.

검증 후 이번에 실행한 격리 launcher를 Ctrl+C로 종료했다. 4318/4319 리스너 0개를 확인했고 변경은 현재 브랜치에 미커밋으로 유지했다.
