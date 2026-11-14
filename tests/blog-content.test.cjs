const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes, textContent } = require('./helpers/react-harness.cjs');

const passthrough = () => null;
const markdownPath = path.resolve(__dirname, '../src/utils/markdown.ts');

async function renderPost(t, content) {
  const harness = createHarness();
  const previousMarkdown = require.cache[markdownPath];
  // Node에는 DOM이 없으므로 DOMPurify 경계만 대체하고 실제 변환 유틸과 marked를 실행한다.
  loadWithMocks(markdownPath, { dompurify: { sanitize: html => html } });
  t.after(() => {
    harness.cleanup();
    if (previousMarkdown) require.cache[markdownPath] = previousMarkdown;
    else delete require.cache[markdownPath];
  });
  const Client = loadWithMocks(path.resolve(__dirname, '../src/app/(site)/blog/[slug]/BlogPostClient.tsx'), {
    react: harness.react,
    'next/link': passthrough,
    'next/image': passthrough,
    'react-hot-toast': { error() {} },
    '@/lib/api': { blogApi: { incrementViewCount: async () => ({ success: true }) } },
  }).default;
  const post = {
    id: 'local-post', slug: 'local-post', title: '로컬 본문 검증',
    content: '', is_published: true, tags: [], view_count: 0,
    created_at: '2026-01-01', updated_at: '2026-01-01', ...content,
  };
  const inner = Client({ slug: post.slug, initialPost: post });
  harness.mount(inner.type, inner.props);
  // flush는 본문 효과의 실제 동적 import와 뒤따른 상태 갱신까지 기다린다.
  await harness.flush();
  return harness.tree();
}

const renderedHtml = tree => nodes(tree, node => node.props?.dangerouslySetInnerHTML)
  .map(node => node.props.dangerouslySetInnerHTML.__html).join('');

test('Markdown이 비어도 저장된 HTML 본문을 표시한다', async t => {
  const tree = await renderPost(t, {
    content_html: '<h2>저장된 HTML 본문</h2><p>본문 내용</p>', content_text: '저장된 HTML 본문 본문 내용',
  });
  assert.equal(renderedHtml(tree), '<h2>저장된 HTML 본문</h2><p>본문 내용</p>');
  assert.doesNotMatch(textContent(tree), /콘텐츠를 불러올 수 없습니다|렌더링하는 중/);
});

test('HTML과 Markdown이 모두 있으면 저장된 HTML 본문을 우선한다', async t => {
  const tree = await renderPost(t, { content: '# 이전 Markdown', content_html: '<p>저장된 최신 본문</p>' });
  assert.equal(renderedHtml(tree), '<p>저장된 최신 본문</p>');
});

test('저장된 HTML이 공백뿐이면 기존 Markdown을 변환한다', async t => {
  const tree = await renderPost(t, { content: '## 기존 Markdown\n\n**강조**', content_html: '  \n ' });
  assert.equal(renderedHtml(tree), '<h2>기존 Markdown</h2>\n<p><strong>강조</strong></p>\n');
});

test('HTML과 Markdown이 모두 없으면 본문 부재 안내를 표시한다', async t => {
  const tree = await renderPost(t, { content_html: '' });
  assert.equal(renderedHtml(tree), '');
  assert.match(textContent(tree), /콘텐츠를 불러올 수 없습니다/);
  assert.doesNotMatch(textContent(tree), /렌더링하는 중/);
});
