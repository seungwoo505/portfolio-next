const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes } = require('./helpers/react-harness.cjs');

async function savePost(t, post, publish) {
  const harness = createHarness();
  const previous = { document: global.document, MutationObserver: global.MutationObserver };
  global.document = { documentElement: { classList: { contains: () => false } }, addEventListener() {}, removeEventListener() {} };
  global.MutationObserver = class { observe() {} disconnect() {} };
  let saved;
  const noop = () => null;
  const Page = loadWithMocks(path.resolve(__dirname, '../src/app/admin/blog/edit/page.tsx'), {
    react: harness.react, 'next/link': noop,
    'next/navigation': { useRouter: () => ({ push() {} }), useSearchParams: () => ({ get: () => 'local-post' }) },
    'react-hot-toast': { success() {}, error() {} },
    '../components/BlogPostForm': noop,
    '../components/blogPostFormUtils': { fetchBlogTagOptions: async () => [], normalizeBlogTagOption: tag => tag },
    '@/lib/api': { authApi: { get: async () => ({ success: true, data: { id: '1', slug: 'local-post', title: '기존 글', content: '기존 본문', tags: [], ...post } }), put: async (_url, value) => { saved = value; return { success: true }; } } },
  }).default;
  t.after(() => { harness.cleanup(); Object.assign(global, previous); });
  const inner = nodes(Page(), node => node.type?.name === 'EditBlogPostContent')[0];
  harness.mount(inner.type);
  await harness.flush();
  await harness.tree().props.onSubmit(publish);
  return saved;
}

test('공개 글의 일반 수정은 기존 발행일을 보존한다', async t => {
  const published_at = '2020-01-02T03:04:05.000Z';
  const saved = await savePost(t, { is_published: true, published_at }, true);
  assert.equal(saved.published_at, published_at);
});
test('발행일이 없는 기존 공개 글에는 임의의 현재 발행일을 만들지 않는다', async t => {
  const saved = await savePost(t, { is_published: true, published_at: null }, true);
  assert.equal(saved.published_at, null);
});
test('초안을 최초 공개할 때는 현재 발행 시각을 기록한다', async t => {
  const before = Date.now();
  const saved = await savePost(t, { is_published: false, published_at: null }, true);
  assert.ok(Date.parse(saved.published_at) >= before && Date.parse(saved.published_at) <= Date.now());
  assert.equal(saved.is_published, true);
});
test('비공개 저장의 발행일 해제 동작은 유지한다', async t => {
  const saved = await savePost(t, { is_published: true, published_at: '2020-01-02T03:04:05.000Z' }, false);
  assert.equal(saved.published_at, null);
  assert.equal(saved.is_published, false);
});
