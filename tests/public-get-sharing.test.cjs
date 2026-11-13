const test = require('node:test');
const assert = require('node:assert/strict');
const { ApiClient } = require('../src/lib/api-client.ts');
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function setup(t) {
  const previous = global.fetch, calls = [];
  global.fetch = (url, init) => { const pending = deferred(); calls.push({ url, init, ...pending }); return pending.promise; };
  t.after(() => { global.fetch = previous; });
  return { client: new ApiClient('http://127.0.0.1:4319'), calls, finish: index => calls[index].resolve(Response.json({ success: true, data: { name: '로컬' } })) };
}
test('동일한 공개 GET은 정규화된 경로와 쿼리로 진행 중에만 공유한다', async t => {
  const { client, calls, finish } = setup(t);
  const first = client.get('/settings', { b: 2, a: 1 }), second = client.get('/public/settings', { a: 1, b: 2 });
  assert.equal(calls.length, 1);
  finish(0); assert.deepEqual(await first, await second);
  const fresh = client.get('/settings', { a: 1, b: 2 }); assert.equal(calls.length, 2); finish(1); await fresh;
  assert.equal(calls[0].init.cache, 'no-store'); assert.match(calls[0].url, /_t=\d+/);
});
test('실패한 공개 GET은 제거해 다음 요청에서 재시도한다', async t => {
  const { client, calls, finish } = setup(t);
  const pending = [client.get('/settings'), client.get('/settings')];
  const handled = Promise.allSettled(pending);
  assert.equal(calls.length, 1); calls[0].reject(new Error('격리 요청 실패'));
  assert.ok((await handled).every(result => result.status === 'rejected'));
  const retry = client.get('/settings'); assert.equal(calls.length, 2); finish(1); await retry;
});
for (const kind of ['query', 'instance', 'admin', 'post']) test(`공개 GET 공유는 서로 다른 ${kind} 요청을 합치지 않는다`, async t => {
  const { client, calls, finish } = setup(t);
  let pending;
  if (kind === 'query') pending = [client.get('/tags', { type: 'blog' }), client.get('/tags', { type: 'project' })];
  if (kind === 'instance') pending = [client.get('/settings'), new ApiClient('http://127.0.0.1:4320').get('/settings')];
  if (kind === 'admin') pending = [client.get('/admin/settings'), client.get('/admin/settings')];
  if (kind === 'post') pending = [client.post('/public/contact', { name: 'a' }), client.post('/public/contact', { name: 'a' })];
  assert.equal(calls.length, 2); finish(0); finish(1); await Promise.all(pending);
});
for (const method of ['post', 'put', 'delete']) test(`${method} 이후 GET은 쓰기 전 진행 요청을 재사용하지 않는다`, async t => {
  const { client, calls, finish } = setup(t);
  const old = client.get('/settings'), mutation = client[method]('/public/settings', { name: '새 값' }), fresh = client.get('/settings');
  assert.equal(calls.length, 3); calls.forEach((_, index) => finish(index)); await Promise.all([old, mutation, fresh]);
});
test('공유한 응답의 한 소비자가 데이터를 수정해도 다른 소비자의 응답은 독립적이다', async t => {
  const { client, finish } = setup(t);
  const first = client.get('/settings'), second = client.get('/settings'); finish(0);
  const [a, b] = await Promise.all([first, second]); a.data.name = '변경';
  assert.equal(b.data.name, '로컬');
});
test('쓰기 전 요청이 늦게 끝나도 새 진행 요청을 제거하지 않는다', async t => {
  const { client, calls, finish } = setup(t);
  const old = client.get('/settings'), mutation = client.post('/public/settings'), fresh = client.get('/settings');
  finish(0); await old;
  const join = client.get('/settings'); assert.equal(calls.length, 3);
  finish(1); finish(2); await Promise.all([mutation, fresh, join]);
});
