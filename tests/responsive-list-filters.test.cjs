const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const React = require('react');
const { createHarness, loadWithMocks, nodes, textContent } = require('./helpers/react-harness.cjs');
async function setup(t, desktop = false) {
  const harness = createHarness(); const previousWindow = global.window;
  let listener, focused = false;
  const media = { matches: desktop, addEventListener: (_, callback) => { listener = callback; }, removeEventListener() {} };
  global.window = { matchMedia: () => media };
  const Component = loadWithMocks(path.resolve(__dirname, '../src/components/site/ResponsiveListFilters.tsx'), { react: harness.react }).default;
  const props = { id: 'local-filters', selectedCount: 2, sortLabel: '제목순', children: [React.createElement('input', { key: 'search', type: 'search' }), React.createElement('select', { key: 'sort' }), React.createElement('button', { key: 'tag' }, '태그')] };
  harness.mount(Component, props); await harness.flush();
  const toggle = () => nodes(harness.tree(), n => n.props?.['data-list-filter-toggle'] !== undefined)[0];
  toggle().props.ref.current = { focus: () => { focused = true; } };
  t.after(() => { harness.cleanup(); global.window = previousWindow; });
  return { harness, props, toggle, panel: () => nodes(harness.tree(), n => n.props?.['data-list-filter-panel'] !== undefined)[0], desktop: async value => { media.matches = value; listener(); await harness.flush(); }, focused: () => focused };
}
test('모바일 필터는 기본 접힘이며 검색과 선택 상태는 유지한다', async t => {
  const env = await setup(t);
  assert.equal(env.toggle().props['aria-expanded'], false);
  assert.equal(env.toggle().props['aria-controls'], env.panel().props.id);
  assert.equal(env.panel().props.inert, true);
  assert.equal(nodes(env.harness.tree(), n => n.type === 'input' && n.props.type === 'search').length, 1);
  assert.match(textContent(env.harness.tree()), /제목순/);
  assert.match(textContent(env.harness.tree()), /2개/);
});
test('모바일 필터 열기와 Escape는 닫힌 컨트롤 제외 및 토글 포커스를 복원한다', async t => {
  const env = await setup(t);
  env.toggle().props.onClick(); await env.harness.flush();
  assert.equal(env.panel().props.inert, false);
  assert.equal(env.toggle().props['aria-expanded'], true);
  env.panel().props.onKeyDown({ key: 'Escape', preventDefault() {}, stopPropagation() {} }); await env.harness.flush();
  assert.equal(env.panel().props.inert, true); assert.equal(env.focused(), true);
});
test('데스크톱과 반응형 변경에서는 접힌 모바일 상태와 독립적으로 필터를 사용할 수 있다', async t => {
  const env = await setup(t, true);
  assert.equal(env.panel().props.inert, false);
  await env.desktop(false); assert.equal(env.panel().props.inert, true);
  await env.desktop(true); assert.equal(env.panel().props.inert, false);
});
