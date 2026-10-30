const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadWithMocks } = require('./helpers/react-harness.cjs');

const source = name => path.resolve(__dirname, '../src', name);
const notFoundError = Object.assign(new Error('문서 없음'), { digest: 'NEXT_HTTP_ERROR_FALLBACK;404' });

function setupFetch(t, replies) {
  const requests = [];
  const originalFetch = global.fetch;
  t.mock.method(console, 'warn', () => {});
  global.fetch = async (url, init) => {
    assert.match(url, /^http:\/\/127\.0\.0\.1:/, '실제 외부 요청은 허용하지 않는다');
    requests.push({ url, init });
    const reply = replies[(requests.length - 1) % replies.length];
    if (typeof reply === 'function') return reply(init);
    return new Response(reply.body ?? JSON.stringify(reply.data ?? { success: false, message: '모의 오류' }), {
      status: reply.status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  t.after(() => { global.fetch = originalFetch; });
  const server = loadWithMocks(source('lib/server-fetch.ts'), {
    '@/lib/api-config': {
      getServerApiBaseUrl: () => 'http://127.0.0.1:4391',
      getServerPublicApiFallbackBaseUrl: () => 'http://127.0.0.1:4392',
    },
  });
  return { server, requests };
}

function loadRoute(kind, server) {
  return loadWithMocks(source(`app/(site)/${kind}/[slug]/page.tsx`), {
    '@/lib/server-fetch': server,
    'next/navigation': { notFound() { throw notFoundError; } },
    [kind === 'projects' ? './ProjectDetailClient' : './BlogPostClient']: () => null,
  });
}

test('HTTP 오류는 응답 본문 형식과 무관하게 상태를 보존한다', async t => {
  const bodies = ['<html>missing</html>', '', JSON.stringify({ error: '문서 없음' })];
  const { server } = setupFetch(t, bodies.flatMap(body => [{ status: 404, body }, { status: 404, body }]));
  for (let index = 0; index < bodies.length; index++) {
    await assert.rejects(server.serverFetch('/public/projects/missing'), error =>
      error.name === 'ServerFetchError' && error.status === 404);
  }
});

test('뒤의 fallback 404는 앞의 503을 문서 부재로 덮어쓰지 않는다', async t => {
  const { server } = setupFetch(t, [{ status: 503 }, { status: 404 }]);
  await assert.rejects(server.serverFetch('/public/projects/local'), error => error.status === 503);
});

test('앞의 404 뒤 fallback 503도 일시적 오류를 보존한다', async t => {
  const { server } = setupFetch(t, [{ status: 404 }, { status: 503 }]);
  await assert.rejects(server.serverFetch('/public/projects/local'), error => error.status === 503);
});

test('기본 캐시와 primary/fallback 제한 시간을 유지하며 정상 fallback 데이터를 반환한다', async t => {
  const delays = [];
  const realSetTimeout = global.setTimeout;
  t.mock.method(global, 'setTimeout', (fn, delay, ...args) => {
    delays.push(delay);
    return realSetTimeout(fn, delay, ...args);
  });
  const data = { id: 'local', title: '로컬 프로젝트' };
  const { server, requests } = setupFetch(t, [{ status: 503 }, { status: 200, data: { success: true, data } }]);
  assert.deepEqual(await server.serverFetch('/public/projects/local'), { success: true, data });
  assert.deepEqual(delays, [1500, 5000]);
  assert.deepEqual(requests.map(({ init }) => [init.cache, init.next.revalidate]), [['force-cache', 300], ['force-cache', 300]]);
});

for (const kind of ['projects', 'blog']) {
  test(`${kind} 상세의 실제 HTTP 404만 notFound로 전달한다`, async t => {
    const { server } = setupFetch(t, [{ status: 404 }]);
    const route = loadRoute(kind, server);
    await assert.rejects(route.default({ params: Promise.resolve({ slug: 'missing' }) }), error => error === notFoundError);
  });

  for (const [name, replies] of [
    ['503 후 fallback 404', [{ status: 503 }, { status: 404 }]],
    ['잘못된 JSON 후 fallback 404', [{ status: 200, body: '{' }, { status: 404 }]],
    ['API 업무 실패', [{ status: 200, data: { success: false, message: '저장소 점검 중' } }]],
    ['성공 응답의 데이터 부재', [{ status: 200, data: { success: true, data: null } }]],
    ['네트워크 실패 후 fallback 404', [() => { throw new TypeError('연결 실패'); }, { status: 404 }]],
  ]) {
    test(`${kind} 상세 ${name}는 404가 아닌 오류 경계로 전달한다`, async t => {
      const { server } = setupFetch(t, replies);
      const route = loadRoute(kind, server);
      for (const render of [route.default, route.generateMetadata]) {
        await assert.rejects(render({ params: Promise.resolve({ slug: 'local' }) }), error => error !== notFoundError);
      }
    });
  }

  test(`${kind} 상세 timeout은 404로 바꾸지 않는다`, async t => {
    const realSetTimeout = global.setTimeout;
    t.mock.method(global, 'setTimeout', (fn, _delay, ...args) => realSetTimeout(fn, 1, ...args));
    const { server } = setupFetch(t, [
      init => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true })),
      { status: 404 },
    ]);
    await assert.rejects(loadRoute(kind, server).default({ params: Promise.resolve({ slug: 'local' }) }),
      error => error !== notFoundError && /완료되지/.test(error.message));
  });
}
