const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');
const { AuthenticatedApiClient } = require('../src/lib/auth-api-client.ts');

const originalFetch = global.fetch;
const originalWindow = global.window;
const originalStorage = global.localStorage;
let client;

beforeEach(() => {
  const values = new Map();
  global.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  global.window = { location: { pathname: '/audit', href: '/audit' } };
  client = new AuthenticatedApiClient('http://audit.invalid');
  client.setToken('expired-access');
  client.setRefreshToken('valid-refresh');
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalWindow === undefined) delete global.window;
  else global.window = originalWindow;
  if (originalStorage === undefined) delete global.localStorage;
  else global.localStorage = originalStorage;
});

const image = () => new File(['image'], '이미지.png', { type: 'image/png' });
const jsonResponse = (body, options = {}) => new Response(JSON.stringify(body), {
  ...options,
  headers: { 'Content-Type': 'application/json', ...options.headers },
});

test('이미지 업로드는 refresh 토큰과 FormData를 보내 만료 토큰 갱신을 허용한다', async () => {
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    const hasRefresh = new Headers(options.headers).get('X-Refresh-Token');
    return hasRefresh
      ? jsonResponse({ success: true, data: { url: '/uploads/images/test.png' } })
      : jsonResponse({ success: false, message: '토큰이 만료되었습니다.' }, { status: 401 });
  };

  const result = await client.uploadImage(image());

  assert.equal(result.success, true);
  assert.equal(new Headers(request.options.headers).get('X-Refresh-Token'), 'valid-refresh');
  assert.equal(new Headers(request.options.headers).get('Content-Type'), null);
  assert.ok(request.options.body instanceof FormData);
  assert.equal(request.options.body.get('image').name, '이미지.png');
});

test('이미지 업로드 응답의 새 access 및 refresh 토큰을 다음 요청에 사용한다', async () => {
  const sentTokens = [];
  global.fetch = async (_url, options) => {
    sentTokens.push(new Headers(options.headers).get('Authorization'));
    return jsonResponse({ success: true, data: { url: '/uploads/images/test.png' } }, {
      headers: { 'X-New-Token': 'renewed-access', 'X-New-Refresh-Token': 'renewed-refresh' },
    });
  };

  await client.uploadImage(image());
  await client.get('/admin/me');

  assert.deepEqual(sentTokens, ['Bearer expired-access', 'Bearer renewed-access']);
  assert.equal(client.getRefreshToken(), 'renewed-refresh');
});

test('다른 요청이 토큰을 갱신한 경우 업로드의 401을 새 토큰으로 한 번 재시도한다', async () => {
  const uploads = [];
  let finishFirstUpload;
  global.fetch = async (url, options) => {
    if (url.includes('/upload/image')) {
      uploads.push(options);
      if (uploads.length === 1) {
        return new Promise(resolve => { finishFirstUpload = resolve; });
      }
      return jsonResponse({ success: true, data: { url: '/uploads/images/test.png' } });
    }
    return jsonResponse({ success: true }, {
      headers: { 'X-New-Token': 'concurrent-access', 'X-New-Refresh-Token': 'concurrent-refresh' },
    });
  };

  const upload = client.uploadImage(image());
  await client.get('/admin/me');
  finishFirstUpload(jsonResponse({ success: false, message: '이미 갱신된 토큰입니다.' }, { status: 401 }));

  assert.equal((await upload).success, true);
  assert.equal(uploads.length, 2);
  assert.equal(new Headers(uploads[1].headers).get('Authorization'), 'Bearer concurrent-access');
  assert.equal(new Headers(uploads[1].headers).get('X-Refresh-Token'), 'concurrent-refresh');
  assert.equal(uploads[1].body, uploads[0].body);
});

test('일반 JSON 요청의 Content-Type과 업로드 실패 메시지는 유지한다', async () => {
  const requests = [];
  global.fetch = async (_url, options) => {
    requests.push(options);
    return jsonResponse({ success: false, error: '파일이 너무 큽니다.' }, { status: 400 });
  };

  await client.post('/admin/settings', { value: 1 });
  const failed = await client.uploadImage(image());

  assert.equal(new Headers(requests[0].headers).get('Content-Type'), 'application/json');
  assert.equal(failed.success, false);
  assert.equal(failed.message, '파일이 너무 큽니다.');
});
