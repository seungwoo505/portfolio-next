const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes, textContent } = require('./helpers/react-harness.cjs');

for (const data of [
  { technologies: ' React, TypeScript, ', skills: [], tags: [] },
  { technologies: '', skills: [{ name: 'React' }], tags: [] },
  { technologies: '', skills: [], tags: ['React'] },
]) test(`카드에 표시한 React는 기술 필터에서도 일치한다: ${JSON.stringify(data)}`, async t => {
  const harness = createHarness();
  const noop = () => null;
  const Page = loadWithMocks(path.resolve(__dirname, '../src/app/(site)/projects/page.tsx'), {
    react: harness.react, 'next/link': 'a',
    'react-hot-toast': Object.assign(() => {}, { error() {} }),
    '@/components/ScrollProgress': noop, '@/components/ProjectCoverImage': noop, '@/components/Pagination': noop,
    '@/lib/api': {
      projectApi: { getAllProjects: async () => ({ success: true, data: [{ id: '1', slug: 'local', title: '로컬 프로젝트', description: '검증', created_at: '2026-01-01', ...data }] }) },
      api: { get: async (url, params) => ({ success: true, data: url === '/tags' && params.type === 'project' ? [{ id: 'react', slug: 'react', name: 'React' }] : [] }) },
    },
  }).default;
  t.after(() => harness.cleanup());
  harness.mount(Page);
  await harness.flush();
  const cards = () => nodes(harness.tree(), node => node.type === 'article');
  assert.equal(cards().length, 1);
  assert.match(textContent(cards()[0]), /React/);
  nodes(harness.tree(), node => node.type === 'button' && textContent(node) === 'React')[0].props.onClick();
  await harness.flush();
  assert.equal(cards().length, 1);
});
