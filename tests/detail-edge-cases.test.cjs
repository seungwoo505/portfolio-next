const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes, textContent } = require('./helpers/react-harness.cjs');
const source = name => path.resolve(__dirname, '../src', name);

for (const [name, prefix, method] of [
  ['getPostBySlug', '/public/posts/', 'blogApi'],
  ['incrementViewCount', '/public/posts/', 'blogApi'],
  ['getProject', '/public/projects/', 'projectApi'],
  ['incrementViewCount', '/public/projects/', 'projectApi'],
  ['getPostsByTag', '/public/posts/tag/', 'blogApi'],
]) test(`${method}.${name}은 slug를 하나의 URL 경로 세그먼트로 전송한다`, () => {
  const requests = [];
  const api = { get: endpoint => requests.push(endpoint), post: endpoint => requests.push(endpoint) };
  const exported = loadWithMocks(source('lib/public-api.ts'), { '@/lib/api-client': { api } });
  for (const slug of ['normal', '한글 주소', '100%완료', 'hash#slug', 'query?key=value', 'literal%20space']) {
    exported[method][name](slug);
    const url = new URL(requests.at(-1), 'http://127.0.0.1');
    const suffix = name === 'incrementViewCount' ? '/view' : '';
    assert.equal(url.pathname, `${prefix}${encodeURIComponent(slug)}${suffix}`);
    assert.equal(url.hash, '');
  }
});

async function detail(t, kind, overrides = {}, viewResponse = { success: true }) {
  const harness = createHarness();
  const markdownPath = source('utils/markdown.ts');
  const previous = require.cache[markdownPath];
  loadWithMocks(markdownPath, { dompurify: { sanitize: html => html } });
  const slugs = [];
  const api = { incrementViewCount: async slug => { slugs.push(slug); if (viewResponse instanceof Error) throw viewResponse; return viewResponse; } };
  const client = loadWithMocks(source(`app/(site)/${kind}/[slug]/${kind === 'blog' ? 'BlogPostClient' : 'ProjectDetailClient'}.tsx`), {
    react: harness.react, 'next/link': 'a', 'next/image': 'img',
    '@/components/ProjectCoverImage': () => null, 'react-hot-toast': { error() {} },
    '@/lib/api': kind === 'blog' ? { blogApi: api } : { projectApi: api },
  }).default;
  t.after(() => { harness.cleanup(); if (previous) require.cache[markdownPath] = previous; else delete require.cache[markdownPath]; });
  const item = { id: '1', slug: 'local', title: '로컬 상세', content: '', content_html: '', created_at: '2026-01-01', tags: [], skills: [], view_count: 30, ...overrides };
  const inner = client(kind === 'blog' ? { slug: item.slug, initialPost: item } : { slug: item.slug, initialProject: item });
  harness.mount(inner.type, inner.props);
  await harness.flush();
  return { tree: harness.tree(), slugs };
}
function viewCount(kind, tree) {
  if (kind === 'blog') return Number(textContent(nodes(tree, node => node.type === 'span' && /^조회 \d+$/.test(textContent(node)))[0]).replace('조회 ', ''));
  const row = nodes(tree, node => node.type === 'div' && Array.isArray(node.props.children) && node.props.children.some(child => child?.type === 'dt' && textContent(child) === '조회'))[0];
  return Number(textContent(nodes(row, node => node.type === 'dd')[0]));
}
for (const slug of ['audit-100%-done', 'literal%20space']) test(`프로젝트 상세는 전달받은 slug를 다시 디코딩하지 않는다: ${slug}`, async t => {
  let rendered;
  await assert.doesNotReject(async () => { rendered = await detail(t, 'projects', { slug }); });
  assert.deepEqual(rendered.slugs, [slug]);
});

for (const kind of ['blog', 'projects']) {
  for (const [label, response, expected] of [
    ['성공', { success: true }, 31],
    ['업무 실패', { success: false }, 30],
    ['중첩 업무 실패', { success: true, data: { success: false } }, 30],
    ['네트워크 실패', new TypeError('fetch failed'), 30],
  ]) test(`${kind} 조회수 ${label} 응답은 표시 값을 올바르게 유지한다`, async t => {
    const rendered = await detail(t, kind, {}, response);
    assert.equal(viewCount(kind, rendered.tree), expected);
  });
}

test('프로젝트 HTML이 공백이면 실제 Markdown 변환으로 본문을 표시한다', async t => {
  const rendered = await detail(t, 'projects', { content_html: ' \n\t ', content: '## 기존 본문\n\n**강조**' });
  const html = nodes(rendered.tree, node => node.props?.dangerouslySetInnerHTML).map(node => node.props.dangerouslySetInnerHTML.__html).join('');
  assert.equal(html, '<h2>기존 본문</h2>\n<p><strong>강조</strong></p>\n');
});
test('프로젝트 본문이 모두 공백이면 영구 렌더링 상태를 표시하지 않는다', async t => {
  const rendered = await detail(t, 'projects', { content_html: ' \n ', content: ' \t ' });
  assert.doesNotMatch(textContent(rendered.tree), /렌더링하는 중/);
});
