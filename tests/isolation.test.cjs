const assert = require('node:assert/strict');
const test = require('node:test');
const config = require('../src/lib/api-config.ts');

const keys = ['NEXT_PUBLIC_ISOLATED_PREVIEW', 'NEXT_PUBLIC_API_URL', 'INTERNAL_API_URL', 'SERVER_PUBLIC_API_FALLBACK_URL'];
function environment(values, run) {
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    keys.forEach((key) => { delete process.env[key]; });
    Object.assign(process.env, values);
    run();
  } finally {
    keys.forEach((key) => {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    });
  }
}

test('isolated preview refuses external, relative, credentialed and missing API destinations', () => {
  const getters = [config.getClientApiBaseUrl, config.getServerApiBaseUrl, config.getServerPublicApiFallbackBaseUrl];
  const destinations = ['https://example.com', '/api', '//example.com', 'http://localhost.example.com', 'http://127.0.0.1@external.invalid', 'http://user:pass@127.0.0.1', 'ftp://127.0.0.1', ''];
  for (const getter of getters) {
    for (const destination of destinations) {
      environment({ NEXT_PUBLIC_ISOLATED_PREVIEW: '1', NEXT_PUBLIC_API_URL: destination, INTERNAL_API_URL: destination, SERVER_PUBLIC_API_FALLBACK_URL: destination }, () => {
        assert.throws(() => getter(), /isolated preview/i, `${getter.name}: ${destination}`);
      });
    }
  }
});

test('isolated preview accepts only explicit loopback URLs for each destination', () => {
  environment({ NEXT_PUBLIC_ISOLATED_PREVIEW: '1', NEXT_PUBLIC_API_URL: 'http://127.0.0.1:4319/', INTERNAL_API_URL: 'http://localhost:4319', SERVER_PUBLIC_API_FALLBACK_URL: 'http://[::1]:4319' }, () => {
    assert.equal(config.getClientApiBaseUrl(), 'http://127.0.0.1:4319');
    assert.equal(config.getServerApiBaseUrl(), 'http://localhost:4319');
    assert.equal(config.getServerPublicApiFallbackBaseUrl(), 'http://[::1]:4319');
  });
});

test('normal deployment retains public defaults and relative client URL behavior', () => {
  environment({}, () => assert.equal(config.getClientApiBaseUrl(), 'https://api.seungwoo.i234.me'));
  environment({ NEXT_PUBLIC_API_URL: '/api' }, () => {
    assert.equal(config.getClientApiBaseUrl(), '/api');
    assert.equal(config.getServerApiBaseUrl(), 'http://127.0.0.1:3333');
    assert.equal(config.getServerPublicApiFallbackBaseUrl(), 'https://api.seungwoo.i234.me');
  });
});

test('outbound guard rejects public IPs, DNS names and redirect targets before transport', async () => {
  const { assertLocalDestination } = require('../scripts/isolated-network.js');
  for (const value of ['https://example.com', 'http://10.0.0.1', 'http://127.0.0.1.example.com', 'file:///tmp/file']) {
    assert.throws(() => assertLocalDestination(value), /blocked/i);
  }
  assert.doesNotThrow(() => assertLocalDestination('http://127.0.0.1:4319/public/profile'));
});

test('installed outbound guard blocks actual fetch, TCP and DNS entry points before transport', () => {
  const { spawnSync } = require('node:child_process');
  const path = require('node:path');
  const result = spawnSync(process.execPath, ['--require', path.resolve(__dirname, '../scripts/isolated-network.js'), '-e', `
    const assert = require('node:assert/strict');
    assert.throws(() => fetch('https://external.invalid'), /blocked/);
    assert.throws(() => require('node:net').connect({ host: '203.0.113.1', port: 443 }), /blocked/);
    assert.throws(() => require('node:dns').lookup('external.invalid', () => {}), /blocked/);
  `], { env: { ...process.env, NEXT_PUBLIC_ISOLATED_PREVIEW: '1' }, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
});

test('Windows NODE_OPTIONS preload survives Node option parsing in a child process', () => {
  const { spawnSync } = require('node:child_process');
  const path = require('node:path');
  const { getGuardNodeOptions } = require('../scripts/isolated-network.js');
  const result = spawnSync(process.execPath, ['-e', 'if (!globalThis.__isolatedNetworkGuard) process.exit(2)'], {
    env: { ...process.env, NEXT_PUBLIC_ISOLATED_PREVIEW: '1', NODE_OPTIONS: getGuardNodeOptions(path.resolve(__dirname, '../scripts/isolated-network.js')) },
    encoding: 'utf8', windowsHide: true,
  });
  assert.equal(result.status, 0, result.stderr);
});

test('fixture authentication, CRUD, contact and views use in-memory explicit test data', async () => {
  const { createFixtureRouter } = require('../scripts/isolated-api.js');
  const route = createFixtureRouter();
  const request = (method, path, body, token) => route({ method, path, body, authorization: token && `Bearer ${token}` });
  assert.equal((await request('GET', '/admin/tags')).status, 401);
  assert.equal((await request('POST', '/admin/login', { username: 'fixture-admin', password: 'wrong' })).status, 401);
  const login = await request('POST', '/admin/login', { username: 'fixture-admin', password: 'fixture-only-password' });
  const token = login.body.data.token;
  assert.ok(token);
  assert.ok(login.body.data.refreshToken);
  assert.equal((await request('GET', '/admin/me', null, token)).body.data.user.username, 'fixture-admin');
  const created = await request('POST', '/admin/tags', { name: '[검증] 생성', slug: 'test-created', type: 'general' }, token);
  const id = created.body.data.id;
  await request('PUT', `/admin/tags/${id}`, { name: '[검증] 수정' }, token);
  assert.ok((await request('GET', '/admin/tags', null, token)).body.data.some((tag) => tag.name === '[검증] 수정'));
  await request('DELETE', `/admin/tags/${id}`, null, token);
  assert.ok(!(await request('GET', '/admin/tags', null, token)).body.data.some((tag) => tag.id === id));
  const contact = await request('POST', '/public/contact', { name: '[검증] 방문자', email: 'fixture@example.invalid', message: '로컬 검증 문의' });
  assert.equal(contact.body.success, true);
  assert.ok((await request('GET', '/admin/contacts', null, token)).body.data.some((item) => item.id === contact.body.data.id));
  const before = (await request('GET', '/public/projects/fixture-project-1')).body.data.view_count;
  await request('POST', '/public/projects/fixture-project-1/view');
  assert.equal((await request('GET', '/public/projects/fixture-project-1')).body.data.view_count, before + 1);
  assert.equal((await request('GET', '/public/projects?search=does-not-exist')).body.data.length, 0);
  assert.equal((await request('GET', '/public/projects?limit=2&page=2')).body.data.length, 2);
  assert.equal((await request('GET', '/undefined-fixture')).status, 404);
});

test('fixture tags honor type filters and retain distinct project/general options', async () => {
  const { createFixtureRouter } = require('../scripts/isolated-api.js');
  const route = createFixtureRouter();
  const groups = [];
  for (const type of ['project', 'general', 'blog']) {
    const response = await route({ method: 'GET', path: `/public/tags?type=${type}&popular=true` });
    assert.equal(response.status, 200);
    assert.ok(response.body.data.length >= 2, `${type} needs two selectable tags`);
    assert.ok(response.body.data.every((tag) => tag.type === type), `${type} returned a tag of another type`);
    groups.push(response.body.data);
  }
  const options = groups.slice(0, 2).flat().map((tag) => tag.name);
  assert.equal(new Set(options).size, options.length, 'project and general filters must not duplicate names');
});

test('fixture 장애 주입은 검증 토큰을 요구하고 지정 상세에만 한 번 실패한 뒤 원래 데이터로 복구한다', async () => {
  const { createFixtureRouter } = require('../scripts/isolated-api.js');
  const route = createFixtureRouter();
  const request = (method, path, body = {}, authorization = 'Bearer isolated-fixture-token') => route({ method, path, body, authorization });
  assert.equal((await request('POST', '/__fixture/faults', { path: '/public/projects/fixture-project-1', status: 503 }, '')).status, 401);
  assert.equal((await request('POST', '/__fixture/faults', { path: '/admin/users', status: 503 })).status, 400);
  assert.equal((await request('POST', '/__fixture/faults', { path: '/public/projects/fixture-project-1', status: 503 })).status, 200);
  assert.equal((await request('GET', '/public/projects/fixture-project-2')).status, 200);
  assert.equal((await request('GET', '/public/projects/fixture-project-1')).status, 503);
  assert.equal((await request('GET', '/public/projects/fixture-project-1')).body.data.slug, 'fixture-project-1');
  const state = await request('GET', '/__fixture/faults');
  assert.equal(state.body.data.requests['/public/projects/fixture-project-1'], 2);
  assert.deepEqual(state.body.data.pending, []);
  await request('POST', '/__fixture/faults', { path: '/public/posts/fixture-post-2', status: 200 });
  const failedBody = await request('GET', '/public/posts/fixture-post-2');
  assert.equal(failedBody.status, 200);
  assert.equal(failedBody.body.success, false);
  assert.equal((await request('GET', '/public/posts/fixture-post-2')).body.success, true);
});