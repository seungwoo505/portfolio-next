const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes, textContent } = require('./helpers/react-harness.cjs');
const source = file => path.resolve(__dirname, '../src', file);
for (const kind of ['blog', 'projects']) for (const [label, html, markdown, expected] of [
  ['주석 HTML 대체', '<!-- 빈 HTML -->', '## 대체 본문', '<h2>대체 본문</h2>'],
  ['제거 대상 HTML 대체', '<script>bad()</script>', '**정상 본문**', '<strong>정상 본문</strong>'],
  ['정상 HTML 우선', '<p>HTML 우선</p>', 'Markdown 후순위', '<p>HTML 우선</p>'],
  ['공백 본문 완료', '   ', ' \n ', ''],
  ['정화 후 빈 본문 완료', '<!-- 빈 HTML -->', '', ''],
]) test(`${kind}: ${label}`, async t => {
  const harness = createHarness();
  const markdownPath = source('utils/markdown.ts');
  const previous = require.cache[markdownPath];
  // DOM 없는 harness에서는 정화의 입출력 경계만 대체하고 실제 marked 변환은 실행한다.
  // 실제 DOMPurify 정화는 격리 Chrome 검사에서 별도로 검증한다.
  loadWithMocks(markdownPath, { dompurify: { sanitize: value => value.replace(/<!--[\s\S]*?-->/g, '').replace(/<script>[\s\S]*?<\/script>/g, '') } });
  const Client = loadWithMocks(source(`app/(site)/${kind}/[slug]/${kind === 'blog' ? 'BlogPostClient' : 'ProjectDetailClient'}.tsx`), {
    react: harness.react, 'next/link': 'a', 'next/image': 'img', '@/components/ProjectCoverImage': () => null,
    'react-hot-toast': { error() {} }, '@/lib/api': { [kind === 'blog' ? 'blogApi' : 'projectApi']: { incrementViewCount: async () => ({ success: true }) } },
  }).default;
  t.after(() => { harness.cleanup(); if (previous) require.cache[markdownPath] = previous; else delete require.cache[markdownPath]; });
  const item = { id: '1', slug: 'local', title: '로컬 상세', content_html: html, content: markdown, tags: [], skills: [], created_at: '2026-01-01' };
  const inner = Client({ slug: item.slug, [kind === 'blog' ? 'initialPost' : 'initialProject']: item });
  harness.mount(inner.type, inner.props); await harness.flush();
  const rendered = nodes(harness.tree(), node => node.props?.dangerouslySetInnerHTML).map(node => node.props.dangerouslySetInnerHTML.__html).join('');
  if (expected) assert.ok(rendered.includes(expected), rendered);
  else assert.equal(rendered.trim(), '');
  assert.doesNotMatch(textContent(harness.tree()), /렌더링하는 중/);
  if (label === '정상 HTML 우선') assert.doesNotMatch(rendered, /Markdown 후순위/);
});
