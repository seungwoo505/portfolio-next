const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
// TypeScript 7 native tsc는 API가 없으므로 공식 6 API 호환 alias로 변환한다.
// 프로젝트 타입 검사는 typecheck 및 build에서 별도로 7 컴파일러를 실행한다.
const ts = require('typescript');

const rootDir = path.resolve(__dirname, '../..');
const resolveFilename = Module._resolveFilename;

// Node 내장 테스트에서 실제 TypeScript/TSX 모듈과 프로젝트 경로 별칭을 읽는다.
Module._resolveFilename = function (request, parent, ...options) {
  const target = request.startsWith('@/')
    ? path.join(rootDir, 'src', request.slice(2))
    : request;
  return resolveFilename.call(this, target, parent, ...options);
};

const loadTypeScript = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  module._compile(outputText, filename);
};

require.extensions['.ts'] = loadTypeScript;
require.extensions['.tsx'] = loadTypeScript;
// 스타일의 실제 적용은 격리 브라우저에서 검증한다.
require.extensions['.css'] = () => {};
