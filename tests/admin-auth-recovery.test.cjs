const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes, textContent } = require('./helpers/react-harness.cjs');

async function setup(t, replies) {
  const harness = createHarness();
  const credentials = { token: 'valid-access', refresh: 'valid-refresh' };
  let calls = 0;
  const authApi = {
    getToken: () => credentials.token,
    clearToken: () => { credentials.token = null; credentials.refresh = null; },
    get: async () => {
      const value = replies[calls++];
      if (value instanceof Error) throw value;
      return value;
    },
  };
  const { AdminProvider } = loadWithMocks(path.resolve(__dirname, '../src/contexts/AdminContext.tsx'), {
    react: harness.react, '@/lib/api': { authApi, adminApi: {} },
  });
  t.after(() => harness.cleanup());
  harness.mount(AdminProvider);
  await harness.flush();
  return { harness, credentials, value: () => harness.tree().props.value, calls: () => calls };
}
const accepted = { success: true, data: { user: { username: 'fixture-admin' }, permissions: ['settings.manage'] } };

for (const order of ['old-failure-first', 'old-failure-last', 'old-denial-last']) {
  test(`중첩된 인증 확인은 최신 요청 결과만 반영한다: ${order}`, async t => {
    let finishOld;
    let finishLatest;
    const old = new Promise(resolve => { finishOld = resolve; });
    const latest = new Promise(resolve => { finishLatest = resolve; });
    const env = await setup(t, [old, latest]);
    const retry = env.value().checkAuth();
    const finishFailure = () => finishOld(order === 'old-denial-last' ? { success: false, message: 'expired old session' } : Promise.reject(new Error('HTTP 503')));
    if (order === 'old-failure-first') {
      finishFailure();
      await env.harness.flush();
      assert.equal(env.value().isLoading, true, '이전 요청은 최신 확인의 로딩 상태를 바꾸지 않는다');
    }
    finishLatest(accepted);
    await retry;
    await env.harness.flush();
    if (order !== 'old-failure-first') finishFailure();
    await env.harness.flush();
    assert.equal(env.value().isAuthenticated, true);
    assert.equal(env.value().authError, null);
    assert.equal(env.value().isLoading, false);
    assert.deepEqual(env.credentials, { token: 'valid-access', refresh: 'valid-refresh' });
  });
}

for (const failure of [new Error('HTTP 503'), new TypeError('fetch failed')]) {
  test(`인증 확인의 일시 실패는 토큰을 보존하고 재시도로 회복한다: ${failure.message}`, async t => {
    const env = await setup(t, [failure, accepted]);
    assert.deepEqual(env.credentials, { token: 'valid-access', refresh: 'valid-refresh' });
    assert.equal(env.value().isAuthenticated, false);
    assert.ok(env.value().authError);
    await env.value().checkAuth();
    await env.harness.flush();
    assert.equal(env.calls(), 2);
    assert.equal(env.value().isAuthenticated, true);
    assert.equal(env.value().authError, null);
    assert.deepEqual(env.value().permissions, ['settings.manage']);
  });
}

test('명시적인 인증 거부는 기존처럼 토큰을 지운다', async t => {
  const env = await setup(t, [{ success: false, message: 'unauthorized' }]);
  assert.deepEqual(env.credentials, { token: null, refresh: null });
  assert.equal(env.value().isAuthenticated, false);
});

test('인증 장애에서는 관리자 콘텐츠와 로그인 리디렉션 대신 재시도를 제공한다', async t => {
  const env = await setup(t, [new Error('HTTP 503'), accepted]);
  const guard = createHarness();
  const redirects = [];
  const Component = loadWithMocks(path.resolve(__dirname, '../src/components/AuthGuard.tsx'), {
    react: guard.react, 'next/link': 'a',
    'next/navigation': { useRouter: () => ({ replace: url => redirects.push(url) }) },
    '@/contexts/AdminContext': { useAdmin: env.value },
  }).default;
  t.after(() => guard.cleanup());
  guard.mount(Component, { children: 'protected-admin-content' });
  await guard.flush();
  assert.deepEqual(redirects, []);
  assert.doesNotMatch(textContent(guard.tree()), /protected-admin-content/);
  const retry = nodes(guard.tree(), node => typeof node.props?.onRetry === 'function')[0];
  assert.ok(retry, '인증 장애에서 다시 시도할 수 있어야 한다');
  retry.props.onRetry();
  await env.harness.flush();
  guard.mount(Component, { children: 'protected-admin-content' });
  await guard.flush();
  assert.match(textContent(guard.tree()), /protected-admin-content/);
});
