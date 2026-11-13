const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
require('@headlessui/react');
const { createHarness, loadWithMocks, nodes, textContent } = require('./helpers/react-harness.cjs');
const source = file => path.resolve(__dirname, '../src', file);
const slugs = ['normal', '한글 주소', '100%완료', 'literal%20space', 'hash#slug', 'query?a=b&c=1', 'slash/slug'];
const special = '한글%20#?a=b&c=1';
const methods = { blog: ['getPost', 'updatePost', 'deletePost', 'publishPost', 'unpublishPost'], projects: ['getProject', 'updateProject', 'deleteProject'] };
for (const [kind, names] of Object.entries(methods)) for (const name of names) {
  test(`관리자 API ${kind}.${name}은 원본 slug를 한 경로 세그먼트로 전송한다`, () => {
    const requests = [];
    const api = Object.fromEntries(['get', 'put', 'delete'].map(method => [method, endpoint => requests.push(endpoint)]));
    const { adminApi } = loadWithMocks(source('lib/admin-api.ts'), { '@/lib/auth-api-client': { authApi: api } });
    for (const slug of slugs) {
      adminApi[kind][name](slug, {});
      const url = new URL(requests.at(-1), 'http://127.0.0.1');
      const suffix = name.endsWith('publishPost') ? '/publish' : '';
      assert.equal(url.pathname, `/admin/${kind === 'blog' ? 'blog/posts' : 'projects'}/slug/${encodeURIComponent(slug)}${suffix}`);
      assert.equal(url.search, ''); assert.equal(url.hash, '');
    }
  });
}
function setup(t, api) {
  const harness = createHarness();
  const previous = { document: global.document, MutationObserver: global.MutationObserver, window: global.window };
  global.window = { addEventListener() {}, removeEventListener() {} };
  global.document = { documentElement: { classList: { contains: () => false } }, addEventListener() {}, removeEventListener() {} };
  global.MutationObserver = class { observe() {} disconnect() {} };
  t.after(() => { harness.cleanup(); Object.assign(global, previous); });
  return { harness, mocks: {
    react: harness.react, 'next/link': 'a', 'next/image': 'img', 'react-hot-toast': { success() {}, error() {} },
    'next/navigation': { useRouter: () => ({ push() {} }), useSearchParams: () => ({ get: () => special }) },
    '@/contexts/AdminContext': { useAdmin: () => ({ isAuthenticated: true, isLoading: false }) },
    '@/lib/api': { authApi: api },
  } };
}
const item = { id: '1', slug: special, title: '로컬 항목', description: '설명', content: '본문', content_text: '본문', tags: [], skills: [], is_published: true, featured: false, is_ongoing: true, start_date: '2026-01-01', created_at: '2026-01-01', updated_at: '2026-01-01' };
for (const kind of ['blog', 'projects']) {
  test(`${kind} 편집 GET과 PUT은 검색 파라미터의 원본 slug를 보존한다`, async t => {
    const requests = [];
    const { harness, mocks } = setup(t, { get: async endpoint => { requests.push(endpoint); return { success: true, data: item }; }, put: async endpoint => { requests.push(endpoint); return { success: true }; } });
    const noop = () => null;
    const Page = loadWithMocks(source(`app/admin/${kind}/edit/page.tsx`), {
      ...mocks, '../components/BlogPostForm': noop, '../components/ProjectAdminForm': noop,
      '../components/blogPostFormUtils': { fetchBlogTagOptions: async () => [], normalizeBlogTagOption: tag => tag },
      '../components/projectFormUtils': { fetchProjectTagOptions: async () => [], normalizeProjectTagOption: tag => tag },
    }).default;
    const inner = nodes(Page(), node => node.type?.name === (kind === 'blog' ? 'EditBlogPostContent' : 'EditProjectContent'))[0];
    harness.mount(inner.type); await harness.flush();
    await harness.tree().props.onSubmit(true); await harness.flush();
    assert.equal(requests.length, 2);
    assert.deepEqual(requests, Array(2).fill(`/admin/${kind === 'blog' ? 'blog/posts' : 'projects'}/slug/${encodeURIComponent(special)}`));
  });
  test(`${kind} 목록의 수정 링크·공개·추천·삭제가 모두 같은 특수문자 slug를 가리킨다`, async t => {
    const requests = [];
    const { harness, mocks } = setup(t, { get: async () => ({ success: true, data: [item] }), put: async endpoint => { requests.push(endpoint); return { success: true }; }, delete: async endpoint => { requests.push(endpoint); return { success: true }; } });
    const Page = loadWithMocks(source(`app/admin/${kind}/page.tsx`), mocks).default;
    harness.mount(Page); await harness.flush();
    const links = nodes(harness.tree(), node => node.type === 'a' && node.props.href?.startsWith(`/admin/${kind}/edit?`));
    assert.equal(links.length, 2, '모바일과 데스크톱 링크 모두 확인');
    for (const link of links) {
      const url = new URL(link.props.href, 'http://127.0.0.1');
      assert.equal(url.searchParams.get('slug'), special); assert.equal(url.hash, '');
    }
    for (const label of ['공개', '일반']) {
      const button = nodes(harness.tree(), node => node.type === 'button' && textContent(node).trim() === label)[0];
      assert.ok(button, label); await button.props.onClick(); await harness.flush();
    }
    nodes(harness.tree(), node => node.type === 'button' && node.props['aria-label'] === '로컬 항목 삭제')[0].props.onClick(); await harness.flush();
    await nodes(harness.tree(), node => node.props?.onConfirm)[0].props.onConfirm(); await harness.flush();
    const base = `/admin/${kind === 'blog' ? 'blog/posts' : 'projects'}/slug/${encodeURIComponent(special)}`;
    assert.deepEqual(requests, kind === 'blog' ? [`${base}/publish`, `${base}/featured`, base] : [base, base, base]);
  });
}
