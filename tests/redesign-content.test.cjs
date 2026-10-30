const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes, textContent } = require('./helpers/react-harness.cjs');

for (const section of ['projects', 'blog']) {
  test(`${section}: 검색 결과가 한 페이지를 넘으면 페이지 이동과 즉시 공개를 유지한다`, async t => {
    const harness = createHarness();
    const previousWindow = global.window;
    global.window = { setInterval: () => 1, clearInterval() {}, scrollTo() {} };
    t.after(() => { harness.cleanup(); global.window = previousWindow; });
    const items = Array.from({ length: 8 }, (_, index) => ({
      id: String(index), slug: `local-${index}`, title: `로컬 검증 ${index}`,
      description: '로컬 검증 설명', content: '', excerpt: '로컬 검증 요약',
      created_at: '2026-01-01', published_at: '2026-01-01', updated_at: '2026-01-01',
      status: 'completed', featured: false, is_published: true, tags: [], skills: [],
      view_count: 0, display_order: index,
    }));
    function Pagination() { return null; }
    const passthrough = () => null;
    const toast = Object.assign(() => {}, { error() {} });
    const page = loadWithMocks(path.resolve(__dirname, `../src/app/(site)/${section}/page.tsx`), {
      react: harness.react, 'react-hot-toast': toast, 'next/link': passthrough,
      '@/components/Pagination': Pagination,
      '@/components/ScrollProgress': passthrough,
      '@/components/ProjectCoverImage': passthrough,
      '@/lib/api': {
        projectApi: { getAllProjects: async () => ({ success: true, data: items }) },
        blogApi: { getAllPosts: async () => ({ success: true, data: items }), getTags: async () => ({ success: true, data: [] }) },
        api: { get: async endpoint => ({ success: true, data: endpoint === '/settings' ? {} : [] }) },
      },
    }).default;
    harness.mount(page);
    await harness.flush();
    assert.equal(nodes(harness.tree(), node => node.type === 'article').length, 6);
    assert.match(textContent(harness.tree()), /로컬 검증 0/);
    nodes(harness.tree(), node => node.type === 'input')[0].props.onChange({ target: { value: '로컬' } });
    await harness.flush();
    const pagination = nodes(harness.tree(), node => node.type === Pagination)[0];
    assert.ok(pagination, '검색 결과에서도 페이지 이동을 표시한다');
    assert.equal(pagination.props.totalPages, 2);
    pagination.props.onPageChange(2);
    await harness.flush();
    assert.equal(nodes(harness.tree(), node => node.type === 'article').length, 2);
    assert.match(textContent(harness.tree()), /로컬 검증 6/);
    assert.doesNotMatch(textContent(harness.tree()), /로컬 검증 0/);
  });
}



for (const [settings, visible] of [
  [{ enable_search: false }, false],
  [{ enable_search: false, search_enabled: true }, false],
  [{ enable_search: true, search_enabled: false }, true],
  [{ search_enabled: false }, false],
  [{}, true],
]) test(`블로그 검색 설정 ${JSON.stringify(settings)}은 검색 표시=${visible}로 적용된다`, async t => {
  const harness = createHarness();
  const previousWindow = global.window;
  global.window = { setInterval: () => 1, clearInterval() {}, scrollTo() {} };
  t.after(() => { harness.cleanup(); global.window = previousWindow; });
  const passthrough = () => null;
  const page = loadWithMocks(path.resolve(__dirname, '../src/app/(site)/blog/page.tsx'), {
    react: harness.react, 'react-hot-toast': { error() {} }, 'next/link': passthrough,
    '@/components/Pagination': passthrough, '@/components/ScrollProgress': passthrough,
    '@/lib/api': {
      blogApi: { getAllPosts: async () => ({ success: true, data: [] }), getTags: async () => ({ success: true, data: [] }) },
      api: { get: async () => ({ success: true, data: settings }) },
    },
  }).default;
  harness.mount(page);
  await harness.flush();
  assert.equal(nodes(harness.tree(), node => node.type === 'input' && node.props.type === 'search').length, visible ? 1 : 0);
});