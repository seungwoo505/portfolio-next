# 로컬 격리 프리뷰 실행

모든 명령은 `D:\portfolio-next`에서 실행한다. Dev/Live 서버와 외부 API에는 접속하지 않는다. 실행 스크립트가 client/internal/fallback API 주소를 모두 loopback으로 고정하고 Node의 TCP·DNS·fetch 외부 요청을 차단한다. 브라우저 검증도 외부 요청을 거부한다.

## 명령과 포트

- `node scripts/isolated-preview.js --build`: 로컬 fixture를 시작하고 격리 production build 후 앱을 실행한다.
- `node scripts/isolated-preview.js --build-only`: 로컬 fixture를 사용하는 build만 실행한 뒤 종료한다.
- `node scripts/isolated-preview.js --start`: 앞서 격리 설정으로 빌드한 앱을 실행한다.
- `node scripts/isolated-preview.js`: 로컬 fixture와 development 앱을 실행한다.
- `node scripts/isolated-smoke.js`: 실행 중인 격리 앱에 Playwright 검증을 수행한다.
- `node scripts/isolated-smoke.js --interactions-only`: 공개 32개 화면 캡처를 생략하고 공개 조작과 관리자 검증을 실행한다. 최종 검증에는 전체 실행을 사용한다.
- 기본 앱 주소는 `http://127.0.0.1:4318`, fixture API 주소는 `http://127.0.0.1:4319`이다.
- 실행 포트는 `ISOLATED_APP_PORT`와 `ISOLATED_API_PORT`로 변경한다. 변경한 경우 smoke에도 `ISOLATED_APP_URL`과 `ISOLATED_API_URL`을 지정한다.

Windows에서 PATH에 Node가 없다면 `C:\Users\QT\AppData\Local\Author Software\nvm\installs\v26.12.0\node.exe`를 사용한다. Playwright는 설치된 시스템 번들을 사용하며 별도 설치가 필요하지 않다.

## 종료와 산출물

실행한 터미널에서 `Ctrl+C`를 누르면 launcher가 자신이 실행한 Next 프로세스 트리와 fixture listener를 종료한다. 프로세스 정보는 `.verification/isolated-preview-processes.json`에 기록된다. 강제 종료가 필요한 경우 이 파일과 현재 프로세스 소유 관계를 확인하고 해당 launcher PID만 대상으로 삼는다. 기록 파일의 PID는 종료 뒤 남을 수 있으므로 실행 중이라는 근거로 단독 사용하지 않는다.

브라우저 결과는 `.verification/isolated-smoke/report.json`과 같은 폴더의 PNG에 보존한다. `.verification`은 Git에서 제외되며 Next build의 `.next` 정리 대상과 분리되어 있다.

## Fixture 주의

계정은 `fixture-admin` / `fixture-only-password`이다. 모든 프로필·프로젝트·글·경험은 실제 이력과 무관한 명시적인 검증 데이터다. 이미지도 외부 주소를 사용하지 않는다. 저장·삭제·문의·조회수 변경은 로컬 메모리에만 반영되며 재시작 시 초기화된다. 이 fixture의 응답은 실제 서버 동작의 검증 근거가 아니다.

일반 배포 동작은 유지된다. 격리 설정으로 만든 빌드는 로컬 검증 전용이며 배포하지 않는다.
