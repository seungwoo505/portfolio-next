const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes, textContent } = require('./helpers/react-harness.cjs');

// Node에는 브라우저 DOM이 없으므로 요소 탐색/속성만 제공한다.
// 목차의 판단, ID 생성, 변경 및 정리는 실제 프로덕션 helper가 수행한다.
class ContentElement {
  constructor(tagName, text = '', attributes = {}, children = []) {
    this.tagName = tagName.toUpperCase();
    this.ownText = text;
    this.attributes = new Map(Object.entries(attributes));
    this.children = children;
    this.scrolls = [];
    for (const child of children) child.parentElement = this;
  }
  get textContent() { return this.ownText + this.children.map(child => child.textContent).join(''); }
  get id() { return this.getAttribute('id') || ''; }
  set id(value) { this.setAttribute('id', value); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  focus() { this.ownerDocument.activeElement = this; }
  scrollIntoView(options) { this.scrolls.push(options); }
  contains(target) { return target === this || this.children.some(child => child.contains(target)); }
  closest() {
    if (this.hasAttribute('hidden') || this.getAttribute('aria-hidden') === 'true') return this;
    return this.parentElement?.closest() || null;
  }
  descendants() { return this.children.flatMap(child => [child, ...child.descendants()]); }
  querySelectorAll(selector) {
    assert.equal(selector, 'h2, h3', '목차는 본문 제목만 탐색한다');
    return this.descendants().filter(child => child.tagName === 'H2' || child.tagName === 'H3');
  }
}

const heading = (text, level = 2, attributes = {}, children = []) => new ContentElement(`h${level}`, text, attributes, children);
function documentFixture(headings, { length = 1400, outside = [], before = [], reduced = false } = {}) {
  const content = new ContentElement('div', '', {}, headings);
  const headingLength = content.textContent.length;
  content.ownText = '가'.repeat(Math.max(0, length - headingLength));
  let documentQueries = 0;
  const doc = {
    documentElement: { classList: { contains: name => name === 'reduced-motion' && reduced } },
    getElementById(id) {
      return [...before, content, ...content.descendants(), ...outside].find(element => element.id === id) || null;
    },
    querySelectorAll(selector) {
      assert.equal(selector, '[id]');
      documentQueries++;
      return [...before, content, ...content.descendants(), ...outside].filter(element => element.hasAttribute('id'));
    },
  };
  for (const element of [content, ...content.descendants(), ...outside, ...before]) element.ownerDocument = doc;
  return { content, headings, documentQueries: () => documentQueries };
}
const prepare = (...args) => require('../src/lib/article-contents.ts').prepareArticleContents(...args);

test('짧거나 유효 제목이 세 개 미만인 글은 ID와 탭 순서를 바꾸지 않는다', () => {
  for (const fixture of [
    documentFixture([heading('소개'), heading('설계'), heading('결과')], { length: 1199 }),
    documentFixture([heading('소개'), heading('설계'), heading('   '), heading('숨김', 3, { hidden: '' })]),
  ]) {
    const result = prepare(fixture.content);
    assert.deepEqual(result.items, []);
    result.cleanup();
    assert.ok(fixture.headings.every(element => element.id === '' && !element.hasAttribute('tabindex')));
    assert.equal(fixture.documentQueries(), 0, '목차가 없을 때 문서 전체 ID 조회도 하지 않는다');
  }
});

test('1200자 경계의 긴 글에서 한글과 인라인 서식을 읽어 계층과 고유 앵커를 만든다', () => {
  const bold = new ContentElement('strong', '설계');
  const code = new ContentElement('code', 'API');
  const fixture = documentFixture([
    heading(' 소개 '), heading('', 3, {}, [bold, new ContentElement('span', ' '), code]), heading('소개'),
  ], { length: 1200 });
  const originalChildren = fixture.headings[1].children;
  const result = prepare(fixture.content);
  assert.deepEqual(result.items, [
    { id: 'section-소개', text: '소개', level: 2 },
    { id: 'section-설계-api', text: '설계 API', level: 3 },
    { id: 'section-소개-2', text: '소개', level: 2 },
  ]);
  assert.equal(fixture.headings[1].children, originalChildren, '인라인 DOM을 다시 쓰지 않는다');
  assert.ok(fixture.headings.every(element => element.getAttribute('tabindex') === '-1'));
  assert.equal(fixture.documentQueries(), 1);
});

test('기존 앵커와 탭 순서를 보존하고 본문 밖의 뒤쪽 ID 충돌까지 회피한다', () => {
  const fixture = documentFixture([
    heading('기존 제목', 2, { id: '기존 앵커', tabindex: '0' }),
    heading('외부와 중복', 3, { id: 'reserved' }),
    heading('새 제목'),
  ], { outside: [new ContentElement('footer', '', { id: 'reserved' }), new ContentElement('span', '', { id: 'section-새-제목' })] });
  const result = prepare(fixture.content);
  assert.deepEqual(result.items, [
    { id: '기존 앵커', text: '기존 제목', level: 2 },
    { id: 'reserved-2', text: '외부와 중복', level: 3 },
    { id: 'section-새-제목-2', text: '새 제목', level: 2 },
  ]);
  assert.equal(fixture.headings[0].getAttribute('tabindex'), '0');
  result.cleanup();
  assert.deepEqual(fixture.headings.map(element => element.id), ['기존 앵커', 'reserved', '']);
  assert.deepEqual(fixture.headings.map(element => element.getAttribute('tabindex')), ['0', null, null]);
});

test('중복 기존 ID와 미래 제목 ID가 겹쳐도 링크 대상은 각각 한 개다', () => {
  const fixture = documentFixture([
    heading('처음', 2, { id: 'shared' }), heading('두번째', 3, { id: 'shared' }), heading('보존', 2, { id: 'shared-2' }),
  ]);
  const result = prepare(fixture.content);
  assert.deepEqual(result.items.map(item => item.id), ['shared', 'shared-3', 'shared-2']);
  assert.equal(new Set(fixture.headings.map(element => element.id)).size, 3);
  result.cleanup();
  assert.deepEqual(fixture.headings.map(element => element.id), ['shared', 'shared', 'shared-2']);
});

test('목차 정리는 자신이 바꾼 속성만 원복하며 다른 기능의 후속 수정을 덮지 않는다', () => {
  const fixture = documentFixture([heading('소개'), heading('설계'), heading('결과')]);
  const result = prepare(fixture.content);
  fixture.headings[0].id = 'later-owner';
  fixture.headings[1].setAttribute('tabindex', '0');
  result.cleanup();
  result.cleanup();
  assert.equal(fixture.headings[0].id, 'later-owner');
  assert.equal(fixture.headings[1].getAttribute('tabindex'), '0');
  assert.equal(fixture.headings[2].id, '');
});

function loadContents(harness) {
  return loadWithMocks(path.resolve(__dirname, '../src/components/site/ArticleContents.tsx'), {
    react: harness.react,
    './article-contents.css': {},
  }).default;
}

test('목차는 모바일에서 접힌 native details와 이스케이프되는 제목/기존 hash 링크를 표시한다', async t => {
  const previousWindow = global.window;
  global.window = { matchMedia: () => ({ matches: false }) };
  const harness = createHarness();
  t.after(() => { harness.cleanup(); global.window = previousWindow; });
  const fixture = documentFixture([heading('<script>표시할 제목</script>'), heading('설계', 3, { id: '기존 앵커' }), heading('결과')]);
  const Component = loadContents(harness);
  harness.mount(Component, { contentRef: { current: fixture.content }, contentKey: 'first' });
  const tree = await harness.flush();
  const details = nodes(tree, node => node.type === 'details')[0];
  assert.equal(details.props.open, false);
  assert.ok(Object.hasOwn(details.props, 'data-article-contents'));
  assert.equal(nodes(tree, node => node.type === 'summary').length, 1);
  assert.equal(nodes(tree, node => node.type === 'nav')[0].props['aria-label'], '이 글의 목차');
  const links = nodes(tree, node => node.type === 'a');
  assert.equal(links.length, 3);
  assert.equal(links[1].props.href, '#%EA%B8%B0%EC%A1%B4%20%EC%95%B5%EC%BB%A4');
  assert.equal(textContent(links[0]), '<script>표시할 제목</script>');
  assert.equal(nodes(tree, node => node.props?.dangerouslySetInnerHTML).length, 0);
  assert.ok(links.every(link => !link.props.onClick), '기본 hash 탐색과 브라우저 히스토리를 유지한다');
});

test('데스크톱 기본 펼침과 사용자 접기를 지원하고 본문 변경/언마운트 시 이전 앵커를 정리한다', async t => {
  const previousWindow = global.window;
  global.window = { matchMedia: () => ({ matches: true }) };
  const harness = createHarness();
  t.after(() => { harness.cleanup(); global.window = previousWindow; });
  const fixture = documentFixture([heading('소개'), heading('설계'), heading('결과')]);
  const reference = { current: fixture.content };
  const Component = loadContents(harness);
  harness.mount(Component, { contentRef: reference, contentKey: 'long' });
  let tree = await harness.flush();
  assert.equal(nodes(tree, node => node.type === 'details')[0].props.open, true);
  nodes(tree, node => node.type === 'details')[0].props.onToggle({ currentTarget: { open: false } });
  tree = await harness.flush();
  assert.equal(nodes(tree, node => node.type === 'details')[0].props.open, false);
  reference.current = documentFixture([heading('짧은 새 본문')], { length: 30 }).content;
  harness.mount(Component, { contentRef: reference, contentKey: 'short' });
  tree = await harness.flush();
  assert.equal(tree, null);
  assert.ok(fixture.headings.every(element => !element.hasAttribute('id') && !element.hasAttribute('tabindex')));
});

test('아직 DOM 참조가 연결되지 않았으면 목차를 추가하지 않는다', async t => {
  const harness = createHarness();
  t.after(() => harness.cleanup());
  const Component = loadContents(harness);
  harness.mount(Component, { contentRef: { current: null }, contentKey: 'ssr' });
  assert.equal(await harness.flush(), null);
});

test('window와 document가 없는 실제 React SSR에서도 빈 결과를 렌더한다', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const Component = loadWithMocks(path.resolve(__dirname, '../src/components/site/ArticleContents.tsx'), {
    './article-contents.css': {},
  }).default;
  assert.equal(typeof global.document, 'undefined');
  assert.equal(renderToStaticMarkup(React.createElement(Component, {
    contentRef: { current: null }, contentKey: 'server-render',
  })), '');
});

for (const preference of ['normal', 'os-reduced', 'app-reduced']) {
  test(`직접 진입한 한글 hash는 목차가 표시된 뒤 같은 본문 제목의 초점과 스크롤을 복원한다: ${preference}`, async t => {
    const previousWindow = global.window;
    const hash = '#section-%EC%84%A4%EA%B3%84';
    global.window = {
      location: { hash },
      matchMedia: query => ({ matches: query === '(min-width: 768px)' || (query.includes('reduced-motion') && preference === 'os-reduced') }),
    };
    const harness = createHarness();
    t.after(() => { harness.cleanup(); global.window = previousWindow; });
    const fixture = documentFixture([heading('소개'), heading('설계'), heading('결과')], { reduced: preference === 'app-reduced' });
    const Component = loadContents(harness);
    harness.mount(Component, { contentRef: { current: fixture.content }, contentKey: 'direct-hash' });
    const tree = await harness.flush();
    assert.equal(fixture.content.ownerDocument.activeElement, fixture.headings[1]);
    assert.deepEqual(fixture.headings[1].scrolls, [{ block: 'start', behavior: preference === 'normal' ? 'auto' : 'instant' }]);
    assert.equal(global.window.location.hash, hash);
    nodes(tree, node => node.type === 'details')[0].props.onToggle({ currentTarget: { open: false } });
    await harness.flush();
    assert.equal(fixture.headings[1].scrolls.length, 1, '사용자 목차 접기는 스크롤을 다시 시작하지 않는다');
  });
}

test('hash가 없거나 잘못됐거나 목차 바깥을 가리키면 본문 스크롤을 강제하지 않는다', async t => {
  const previousWindow = global.window;
  t.after(() => { global.window = previousWindow; });
  for (const hash of ['', '#%invalid', '#outside', '#missing']) {
    global.window = { location: { hash }, matchMedia: () => ({ matches: false }) };
    const harness = createHarness();
    const fixture = documentFixture([heading('소개'), heading('설계'), heading('결과')], {
      outside: [new ContentElement('footer', '외부 앵커', { id: 'outside' })],
    });
    const Component = loadContents(harness);
    harness.mount(Component, { contentRef: { current: fixture.content }, contentKey: `ignored-${hash}` });
    await harness.flush();
    assert.equal(fixture.content.ownerDocument.activeElement, undefined);
    assert.ok(fixture.headings.every(element => element.scrolls.length === 0));
    harness.cleanup();
  }
});

async function renderDetail(t, kind, content) {
  const harness = createHarness();
  const markdownPath = path.resolve(__dirname, '../src/utils/markdown.ts');
  const previousMarkdown = require.cache[markdownPath];
  let sanitizations = 0;
  loadWithMocks(markdownPath, { dompurify: { sanitize(html) { sanitizations++; return html; } } });
  t.after(() => {
    harness.cleanup();
    if (previousMarkdown) require.cache[markdownPath] = previousMarkdown;
    else delete require.cache[markdownPath];
  });
  const isProject = kind === 'project';
  const filename = isProject
    ? '../src/app/(site)/projects/[slug]/ProjectDetailClient.tsx'
    : '../src/app/(site)/blog/[slug]/BlogPostClient.tsx';
  const passthrough = () => null;
  const Client = loadWithMocks(path.resolve(__dirname, filename), {
    react: harness.react,
    'next/link': passthrough,
    'next/image': passthrough,
    '@/components/ProjectCoverImage': passthrough,
    'react-hot-toast': { error() {} },
    '@/lib/api': {
      blogApi: { incrementViewCount: async () => ({ success: true }) },
      projectApi: { incrementViewCount: async () => ({ success: true }) },
    },
  }).default;
  const data = {
    id: 'local-detail', slug: 'local-detail', title: '로컬 본문', tags: [], skills: [],
    is_published: true, view_count: 0, created_at: '2026-01-01', updated_at: '2026-01-01', ...content,
  };
  const inner = Client({ slug: data.slug, [isProject ? 'initialProject' : 'initialPost']: data });
  harness.mount(inner.type, inner.props);
  await harness.flush();
  return { tree: harness.tree(), sanitizations };
}

for (const kind of ['project', 'blog']) {
  test(`${kind} 목차 통합은 실제 Markdown 변환과 기존 HTML 정화 경계를 보존한다`, async t => {
    const rendered = await renderDetail(t, kind, {
      content: '## 설계\n\n**강조**와 `API`\n\n```html\n<div>A & B</div>\n```',
    });
    const blocks = nodes(rendered.tree, node => node.props?.dangerouslySetInnerHTML);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].props.dangerouslySetInnerHTML.__html,
      '<h2>설계</h2>\n<p><strong>강조</strong>와 <code class="markdown-inline-code">API</code></p>\n<pre class="markdown-code-block"><code class="language-html">&lt;div&gt;A &amp; B&lt;/div&gt;</code></pre>');
    assert.equal(rendered.sanitizations, 1);
  });

  test(`${kind} 목차 통합은 저장 HTML의 인라인 서식·이미지·기존 앵커 문자열을 그대로 렌더한다`, async t => {
    const original = '<h2 id="기존-앵커">설계 <strong>핵심</strong></h2><p>본문 <a href="#기존-앵커">이동</a></p><img src="/local.jpg" alt="그림">';
    const rendered = await renderDetail(t, kind, { content_html: original, content: '오래된 Markdown' });
    const blocks = nodes(rendered.tree, node => node.props?.dangerouslySetInnerHTML);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].props.dangerouslySetInnerHTML.__html, original);
    assert.equal(rendered.sanitizations, 1);
  });
}
