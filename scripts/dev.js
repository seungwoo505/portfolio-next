// Windows에서도 기존 polling 설정과 Next 개발 서버 인자를 그대로 사용한다.
process.env.WATCHPACK_POLLING ??= 'true';
process.argv.splice(2, 0, 'dev');
require('next/dist/bin/next');
