const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes } = require('./helpers/react-harness.cjs');

for (const section of ['projects', 'blog']) for (const preference of ['os', 'app', 'normal', 'unsupported']) {
  test(`${section}: ${preference} 설정에 맞춰 페이지를 넘긴 뒤 스크롤한다`, async t => {
    const harness = createHarness();
    const previous = { window: global.window, document: global.document };
    const calls = [];
    global.window = { scrollTo: options => calls.push(options), ...(preference === 'unsupported' ? {} : { matchMedia: () => ({ matches: preference === 'os' }) }) };
    global.document = { documentElement: { classList: { contains: name => name === 'reduced-motion' && preference === 'app' } } };
    t.after(() => { harness.cleanup(); Object.assign(global, previous); });
    const items = Array.from({ length: 8 }, (_, index) => ({ id: String(index), slug: `local-${index}`, title: `검증 ${index}`, description: '검증', excerpt: '검증', content: '', tags: [], skills: [], created_at: '2026-01-01', published_at: '2026-01-01', status: 'completed', is_published: true }));
    const noop = () => null;
    function Pagination() { return null; }
    const page = loadWithMocks(path.resolve(__dirname, `../src/app/(site)/${section}/page.tsx`), {
      react: harness.react, 'next/link': noop, 'react-hot-toast': Object.assign(noop, { error() {} }),
      '@/components/Pagination': Pagination, '@/components/ScrollProgress': noop, '@/components/ProjectCoverImage': noop,
      '@/lib/api': {
        projectApi: { getAllProjects: async () => ({ success: true, data: items }) },
        blogApi: { getAllPosts: async () => ({ success: true, data: items }), getTags: async () => ({ success: true, data: [] }) },
        api: { get: async endpoint => ({ success: true, data: endpoint === '/settings' ? {} : [] }) },
      },
    }).default;
    harness.mount(page); await harness.flush();
    nodes(harness.tree(), node => node.type === Pagination)[0].props.onPageChange(2); await harness.flush();
    assert.equal(nodes(harness.tree(), node => node.type === 'article').length, 2);
    assert.deepEqual(calls, [{ top: 0, behavior: preference === 'os' || preference === 'app' ? 'instant' : 'smooth' }]);
  });
}
