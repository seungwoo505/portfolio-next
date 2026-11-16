const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');
const { setTimeout: delay } = require('node:timers/promises');
const { AuthenticatedApiClient } = require('../src/lib/auth-api-client.ts');

const originals = { fetch: global.fetch, window: global.window, storage: global.localStorage };
let client;
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', ...headers },
});
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const rotated = () => json({ success: true, data: { url: '/image.png' } }, 200, {
  'X-New-Token': 'new-access', 'X-New-Refresh-Token': 'new-refresh',
});

beforeEach(() => {
  const values = new Map();
  global.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  global.window = { location: { pathname: '/admin/projects/edit', href: '/admin/projects/edit' } };
  client = new AuthenticatedApiClient('http://audit.invalid');
  client.setToken('old-access');
  client.setRefreshToken('old-refresh');
});
afterEach(() => {
  global.fetch = originals.fetch;
  for (const [name, value] of [['window', originals.window], ['localStorage', originals.storage]]) {
    if (value === undefined) delete global[name];
    else global[name] = value;
  }
});

test('갱신 성공 응답이 250ms보다 늦어도 동시 401 요청은 세션을 지우지 않고 재시도한다', async () => {
  const winner = deferred();
  let reads = 0;
  global.fetch = async url => {
    if (url.includes('/upload/image')) return winner.promise;
    reads += 1;
    return reads === 1 ? json({ success: false }, 401) : json({ success: true });
  };
  const upload = client.uploadImage(new File(['image'], 'image.png', { type: 'image/png' }));
  let earlyResult = false;
  const read = client.get('/admin/me').then(result => { earlyResult = true; return result; });
  await delay(300);
  const beforeWinner = { earlyResult, token: client.getToken(), href: window.location.href };
  winner.resolve(rotated());
  const [uploaded, loaded] = await Promise.all([upload, read]);
  assert.deepEqual(beforeWinner, { earlyResult: false, token: 'old-access', href: '/admin/projects/edit' });
  assert.equal(uploaded.success, true);
  assert.equal(loaded.success, true);
  assert.equal(reads, 2);
  assert.equal(client.getToken(), 'new-access');
  assert.equal(window.location.href, '/admin/projects/edit');
});

test('동시 요청이 모두 401이면 교착 없이 인증을 종료한다', { timeout: 1500 }, async () => {
  global.fetch = async () => json({ success: false }, 401);
  const results = await Promise.all([client.get('/admin/a'), client.get('/admin/b'), client.get('/admin/c')]);
  assert.ok(results.every(result => result.success === false));
  assert.equal(client.getToken(), null);
  assert.equal(client.getRefreshToken(), null);
  assert.equal(window.location.href, '/admin-login');
});

test('로그인 화면의 이전 토큰 만료는 페이지를 다시 이동시켜 진행 중 로그인을 끊지 않는다', async () => {
  let navigations = 0;
  window.location = { pathname: '/admin-login',
    get href() { return '/admin-login?next=/admin'; },
    set href(_value) { navigations += 1; } };
  global.fetch = async () => json({ success: false }, 401);
  assert.equal((await client.get('/admin/me')).success, false);
  assert.equal(client.getToken(), null);
  assert.equal(navigations, 0);
});

test('다른 진행 중 요청이 실패해도 401 대기가 끝나며 미처리 거부를 만들지 않는다', async () => {
  const peer = deferred();
  global.fetch = async url => url.includes('/peer') ? peer.promise : json({ success: false }, 401);
  const failed = client.get('/admin/peer').catch(error => error.message);
  const unauthorized = client.get('/admin/me');
  peer.resolve(json({ success: false, message: '서버 오류' }, 500));
  assert.equal(await failed, '서버 오류');
  assert.equal((await unauthorized).success, false);
  assert.equal(client.getToken(), null);
});

test('로그아웃 뒤 도착한 갱신 응답은 토큰을 되살리지 않는다', async () => {
  const response = deferred();
  global.fetch = async () => response.promise;
  const pending = client.get('/admin/me');
  client.clearToken();
  response.resolve(rotated());
  await pending;
  assert.equal(client.getToken(), null);
  assert.equal(client.getRefreshToken(), null);
});

test('이전 로그인 요청의 늦은 401이 새 로그인 세션을 지우거나 새 세션으로 재전송하지 않는다', async () => {
  const response = deferred();
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return calls === 1 ? response.promise : json({ success: false }, 401);
  };
  const pending = client.get('/admin/me');
  client.setToken('another-login-access');
  client.setRefreshToken('another-login-refresh');
  response.resolve(json({ success: false }, 401));
  await pending;
  assert.equal(calls, 1);
  assert.equal(client.getToken(), 'another-login-access');
  assert.equal(client.getRefreshToken(), 'another-login-refresh');
  assert.equal(window.location.href, '/admin/projects/edit');
});

for (const method of ['post', 'put', 'delete']) {
  test(`갱신 대기 await 경계에서 새 로그인해도 이전 ${method.toUpperCase()}를 새 계정으로 재전송하지 않는다`, async () => {
    for (let ticks = 0; ticks < 12; ticks += 1) {
      const runClient = new AuthenticatedApiClient('http://audit.invalid');
      runClient.setToken('old-access');
      runClient.setRefreshToken('old-refresh');
      const winner = deferred();
      const sentTokens = [];
      global.fetch = async (url, options) => {
        if (url.includes('/winner')) return winner.promise;
        sentTokens.push(new Headers(options.headers).get('Authorization'));
        return sentTokens.length === 1 ? json({ success: false }, 401) : json({ success: true });
      };
      const refresh = runClient.get('/admin/winner');
      const mutation = runClient[method]('/admin/mutation', { value: 'old-user-work' });
      await new Promise(resolve => setImmediate(resolve));
      winner.resolve(json({ success: true }, 200, {
        'X-New-Token': 'rotated-access', 'X-New-Refresh-Token': 'rotated-refresh',
      }));
      // 실제 응답·await 마이크로태스크 경계 앞뒤에서 로그인 시점을 이동시킨다.
      let login = Promise.resolve();
      for (let index = 0; index < ticks; index += 1) login = login.then(() => {});
      login = login.then(() => {
        runClient.setToken('new-login-access');
        runClient.setRefreshToken('new-login-refresh');
      });
      await Promise.all([refresh, mutation, login]);
      assert.equal(sentTokens.includes('Bearer new-login-access'), false, `로그인 지연 ${ticks} ticks`);
      assert.equal(runClient.getToken(), 'new-login-access');
      assert.equal(runClient.getRefreshToken(), 'new-login-refresh');
    }
  });
}

for (const failure of [408, 500, 503, 'network']) {
  test(`명시적 갱신의 일시적 실패 ${failure}는 재시도할 토큰을 유지한다`, async () => {
    global.fetch = async () => {
      if (failure === 'network') throw new TypeError('fetch failed');
      return json({ success: false }, failure);
    };
    assert.equal(await client.refreshToken(), false);
    assert.equal(client.getToken(), 'old-access');
    assert.equal(client.getRefreshToken(), 'old-refresh');
  });
}

test('명시적 갱신의 지연 응답도 다른 401 요청과 조정한다', async () => {
  const response = deferred();
  let reads = 0;
  global.fetch = async url => {
    if (url.endsWith('/admin/refresh')) return response.promise;
    reads += 1;
    return reads === 1 ? json({ success: false }, 401) : json({ success: true });
  };
  const refresh = client.refreshToken();
  const read = client.get('/admin/me');
  await delay(300);
  response.resolve(json({ success: true, data: { token: 'manual-access', refreshToken: 'manual-refresh' } }));
  assert.equal(await refresh, true);
  assert.equal((await read).success, true);
  assert.equal(client.getToken(), 'manual-access');
  assert.equal(window.location.href, '/admin/projects/edit');
});

test('명시적 갱신의 확정 401은 만료된 인증 정보를 제거한다', async () => {
  global.fetch = async () => json({ success: false }, 401);
  assert.equal(await client.refreshToken(), false);
  assert.equal(client.getToken(), null);
  assert.equal(client.getRefreshToken(), null);
});

test('명시적 갱신도 로그아웃 뒤 새 토큰을 적용하지 않는다', async () => {
  const response = deferred();
  global.fetch = async () => response.promise;
  const pending = client.refreshToken();
  client.clearToken();
  response.resolve(json({ success: true, data: { token: 'late-access', refreshToken: 'late-refresh' } }));
  assert.equal(await pending, false);
  assert.equal(client.getToken(), null);
  assert.equal(client.getRefreshToken(), null);
});
