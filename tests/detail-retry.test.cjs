const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes, textContent } = require('./helpers/react-harness.cjs');
const source = name => path.resolve(__dirname, '../src', name);

test('상세 재시도는 검증된 프로젝트/블로그의 해당 경로만 무효화한다', async () => {
  const invalidated = [];
  const { retryDetail } = loadWithMocks(source('lib/retry-detail.ts'), {
    'next/cache': { revalidatePath: (...args) => invalidated.push(args) },
  });
  await retryDetail('/projects/local-project');
  await retryDetail('/blog/%EB%A1%9C%EC%BB%AC');
  assert.deepEqual(invalidated, [['/projects/local-project'], ['/blog/%EB%A1%9C%EC%BB%AC']]);
  for (const pathname of ['/projects', '/blog/', '/admin/users', '/', '/projects/a/b', '/projects/..', '/projects/%2e%2e', '/projects/%2fadmin', '/blog/[slug]', '/projects/a?all=1', '/blog/a#hash', '//example.test/projects/a', 'https://example.test/projects/a']) {
    await assert.rejects(retryDetail(pathname));
  }
  assert.equal(invalidated.length, 2, '잘못된 경로가 목록이나 다른 화면의 캐시를 비우면 안 된다');
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

async function renderError(t, pathname, retry) {
  const harness = createHarness();
  const events = [];
  t.after(() => harness.cleanup());
  const Page = loadWithMocks(source('components/site/DetailError.tsx'), {
    react: harness.react,
    'next/link': 'a',
    'next/navigation': { usePathname: () => pathname, useRouter: () => ({ refresh: () => events.push('refresh') }) },
    '@/lib/retry-detail': { retryDetail: retry },
  }).default;
  harness.mount(Page, { error: new Error('내부 API 주소나 오류 원문'), reset: () => events.push('reset') });
  await harness.flush();
  return { harness, events };
}

for (const pathname of ['/projects/local-project', '/blog/local-post']) {
  test(`${pathname} 오류의 다시 시도는 중복을 막고 캐시 무효화 후 서버 조회와 경계를 재실행한다`, async t => {
    const pending = deferred();
    const calls = [];
    const { harness, events } = await renderError(t, pathname, async target => { calls.push(target); await pending.promise; events.push('invalidated'); });
    assert.match(textContent(harness.tree()), /다시 시도/);
    assert.doesNotMatch(textContent(harness.tree()), /내부 API 주소나 오류 원문/);
    const retryButton = () => nodes(harness.tree(), node => node.type === 'button')[0];
    const attempt = retryButton().props.onClick();
    retryButton().props.onClick();
    await harness.flush();
    assert.deepEqual(calls, [pathname]);
    assert.equal(retryButton().props.disabled, true);
    assert.deepEqual(events, []);
    pending.resolve();
    await attempt;
    await harness.flush();
    assert.deepEqual(events, ['invalidated', 'refresh', 'reset']);
    assert.equal(retryButton().props.disabled, true, '새 서버 응답으로 교체될 때까지 중복 재시도를 막는다');
    assert.equal(nodes(harness.tree(), node => node.type === 'a')[0].props.href, pathname.startsWith('/blog/') ? '/blog' : '/projects');
  });
}

test('캐시 무효화 요청이 실패하면 오류를 안내하고 재시도 버튼을 다시 활성화한다', async t => {
  let attempts = 0;
  const { harness, events } = await renderError(t, '/projects/local', async () => {
    attempts++;
    if (attempts === 1) throw new Error('모의 서버 액션 실패');
  });
  const retryButton = () => nodes(harness.tree(), node => node.type === 'button')[0];
  await retryButton().props.onClick();
  await harness.flush();
  assert.equal(retryButton().props.disabled, false);
  assert.match(textContent(nodes(harness.tree(), node => node.props?.role === 'alert')[0]), /다시 시도/);
  assert.deepEqual(events, []);
  await retryButton().props.onClick();
  await harness.flush();
  assert.deepEqual(events, ['refresh', 'reset']);
  assert.equal(attempts, 2);
});
