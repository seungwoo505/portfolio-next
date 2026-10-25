const test = require('node:test');
const assert = require('node:assert/strict');
const { getInitialBlockContent, extractPlainTextFromBlocks } = require('../src/utils/block-content.ts');
const { loadWithDependencies, createEditorHarness } = require('./helpers/editor-harness.cjs');

const image = [{ type: 'image', props: { url: '/photo.png' } }];
const table = [{ type: 'table', content: { type: 'tableContent', rows: [{ cells: [[{ type: 'text', text: '표 내용', styles: {} }]] }] } }];
const markdown = '**강조** [링크](https://example.com)\n\n- 목록\n\n```html\n<div>예시</div>\n```\n\n![사진](/photo.png)';
const richBlocks = [
  { type: 'paragraph', content: [{ type: 'text', text: '강조', styles: { bold: true } }, { type: 'link', href: 'https://example.com', content: [{ type: 'text', text: '링크', styles: {} }] }] },
  { type: 'bulletListItem', content: '목록' },
  { type: 'codeBlock', props: { language: 'html' }, content: '<div>예시</div>' },
  ...image,
];

test('텍스트가 없는 저장된 이미지 블록을 기존 Markdown보다 우선 보존한다', () => {
  assert.deepEqual(getInitialBlockContent(JSON.stringify(image), '이전 본문'), image);
});

test('표 전용 본문과 중첩 이미지 블록을 보존한다', () => {
  assert.deepEqual(getInitialBlockContent(table, ''), table);
  const nested = [{ type: 'paragraph', content: '', children: image }];
  assert.deepEqual(getInitialBlockContent(nested, ''), nested);
});

test('구분선 전용 저장 본문은 빈 문단이나 기존 Markdown으로 대체하지 않는다', () => {
  const divider = [{ type: 'divider' }];
  assert.deepEqual(getInitialBlockContent(divider, ''), divider);
  assert.deepEqual(getInitialBlockContent(JSON.stringify(divider), '이전 본문'), divider);
});

test('빈 문단에 중첩된 구분선을 보존한다', () => {
  const nested = [{ type: 'paragraph', content: '', children: [{ type: 'divider' }] }];
  assert.deepEqual(getInitialBlockContent(nested, ''), nested);
});

test('빈 문단은 기존 Markdown의 구분선 파서 결과로 가져온다', () => {
  const divider = [{ type: 'divider', props: {}, content: [] }];
  assert.deepEqual(getInitialBlockContent([{ type: 'paragraph', content: '' }], '---', (source) => {
    assert.equal(source, '---');
    return divider;
  }), divider);
});

test('기존 Markdown은 공식 파서 결과의 스타일과 블록 구조를 보존한다', () => {
  assert.deepEqual(getInitialBlockContent(null, markdown, (source) => {
    assert.equal(source, markdown);
    return richBlocks;
  }), richBlocks);
});

test('기존 Markdown의 파서 실패를 빈 문서로 바꾸지 않는다', () => {
  assert.throws(() => getInitialBlockContent(null, markdown, () => { throw new Error('parse failure'); }), /parse failure/);
});

test('파서가 빈 결과를 반환해도 기존 Markdown을 빈 본문으로 덮어쓰지 않는다', () => {
  assert.throws(() => getInitialBlockContent(null, markdown, () => []));
  assert.throws(() => getInitialBlockContent(null, markdown));
});

test('빈 본문은 파서를 호출하지 않고 빈 문단을 제공한다', () => {
  assert.deepEqual(getInitialBlockContent(null, '  ', () => { throw new Error('unexpected parser'); }), [{ type: 'paragraph', content: '' }]);
});

test('표 셀 텍스트도 저장용 일반 텍스트에 포함한다', () => {
  assert.equal(extractPlainTextFromBlocks(table), '표 내용');
});

test('fenced HTML 코드의 태그와 앰퍼샌드를 표시 가능한 문자로 변환한다', () => {
  const { markdownToHtml } = loadWithDependencies('../../src/utils/markdown.ts', {
    dompurify: { sanitize: (html) => html },
  });
  const html = markdownToHtml('```html\n<div title="예시">A & B</div>\n```');
  assert.ok(html.includes('&lt;div title="예시"&gt;A &amp; B&lt;/div&gt;'), html);
  assert.ok(!html.includes('<div title='), html);
});

const makeEditor = (parse = () => richBlocks) => ({
  document: [],
  tryParseMarkdownToBlocks: parse,
  replaceBlocks(_old, next) { this.document = next; },
  blocksToMarkdownLossy: () => '사용자 변경',
  blocksToHTMLLossy: () => '<p>사용자 변경</p>',
});
const makeProps = (onChange, legacyMarkdown = markdown) => ({ value: null, legacyMarkdown, isDarkMode: false, onChange, onImageUpload: async () => '/upload.png' });
const editorView = (tree) => (Array.isArray(tree.props.children) ? tree.props.children : [tree.props.children]).find((child) => child?.type === 'blocknote-view');

test('구분선 Markdown을 가져온 편집기는 편집 가능한 상태를 유지한다', () => {
  const divider = [{ type: 'divider', props: {}, content: [] }];
  const changes = [];
  const editor = makeEditor(() => divider);
  const harness = createEditorHarness(editor, makeProps((value) => changes.push(value), '---'));
  harness.render();
  harness.flushEffects();
  const tree = harness.render();
  assert.equal(editorView(tree).props.editable, true);
  assert.deepEqual(editor.document, divider);
  editorView(tree).props.onChange();
  assert.equal(changes.length, 0);
});

test('편집기 초기화 이벤트는 원문을 덮어쓰지 않고 실제 수정만 내보낸다', () => {
  const changes = [];
  const editor = makeEditor();
  const harness = createEditorHarness(editor, makeProps((value) => changes.push(value)));
  editorView(harness.render()).props.onChange();
  assert.equal(changes.length, 0);
  harness.flushEffects();
  const view = editorView(harness.render());
  assert.deepEqual(editor.document, richBlocks);
  view.props.onChange();
  assert.equal(changes.length, 0);
  editor.document = [{ type: 'paragraph', content: '사용자 변경' }];
  view.props.onChange();
  assert.equal(changes.length, 1);
  assert.equal(changes[0].text, '사용자 변경');
});

test('가져오기 실패 시 편집과 빈 본문 변경 전파를 막는다', () => {
  const changes = [];
  const editor = makeEditor(() => { throw new Error('parse failure'); });
  const harness = createEditorHarness(editor, makeProps((value) => changes.push(value)));
  harness.render();
  harness.flushEffects();
  const tree = harness.render();
  const children = Array.isArray(tree.props.children) ? tree.props.children : [tree.props.children];
  const view = children.find((child) => child?.type === 'blocknote-view');
  assert.equal(view.props.editable, false);
  view.props.onChange();
  assert.equal(changes.length, 0);
  assert.ok(children.some((child) => child?.props?.role === 'alert'));
});

test('새 빈 문서의 초기화는 전파하지 않고 입력 및 전체 삭제는 전파한다', () => {
  const changes = [];
  const editor = makeEditor(() => { throw new Error('빈 본문에는 파서 호출 불필요'); });
  const harness = createEditorHarness(editor, makeProps((value) => changes.push(value), ''));
  harness.render();
  harness.flushEffects();
  const view = editorView(harness.render());
  assert.equal(view.props.editable, true);
  view.props.onChange();
  assert.equal(changes.length, 0);
  editor.document = [{ type: 'paragraph', content: '입력' }];
  view.props.onChange();
  editor.document = [{ type: 'paragraph', content: '' }];
  view.props.onChange();
  assert.equal(changes.length, 2);
  assert.equal(changes[1].text, '');
  assert.deepEqual(changes[1].blocks, [{ type: 'paragraph', content: '' }]);
});
