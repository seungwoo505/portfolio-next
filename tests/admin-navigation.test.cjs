const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes } = require('./helpers/react-harness.cjs');

async function setup(t, desktop = false) {
  const harness = createHarness();
  const previousWindow = global.window;
  const listeners = new Set();
  const media = { matches: desktop, addEventListener(type, fn) { listeners.add(fn); }, removeEventListener(type, fn) { listeners.delete(fn); } };
  global.window = { matchMedia: () => media };
  let pathname = '/admin';
  let closes = 0;
  const onClose = () => { closes += 1; };
  const Sidebar = loadWithMocks(path.resolve(__dirname, '../src/app/admin/components/AdminSidebar.tsx'), {
    react: harness.react, 'next/navigation': { usePathname: () => pathname },
  }).default;
  t.after(() => { harness.cleanup(); global.window = previousWindow; });
  harness.mount(Sidebar, { isOpen: true, onClose });
  await harness.flush();
  return { harness, media, listeners, onClose, Sidebar, get closes() { return closes; },
    async path(value) { pathname = value; harness.mount(Sidebar, { isOpen: true, onClose }); await harness.flush(); },
    async desktop(value) { media.matches = value; for (const listener of listeners) listener(); await harness.flush(); },
  };
}

test('관리자 모바일 메뉴는 native 경로 변경 뒤 닫혀 이전 화면의 overlay를 남기지 않는다', async t => {
  const env = await setup(t);
  assert.equal(env.closes, 0);
  await env.path('/admin/tags');
  assert.equal(env.closes, 1);
});

test('관리자 메뉴는 desktop 전환 때 모바일 열림 상태를 정리하고 리스너를 해제한다', async t => {
  const env = await setup(t);
  await env.desktop(true);
  assert.equal(env.closes, 1);
  const links = nodes(env.harness.tree(), node => node.props?.href === '/admin/tags');
  assert.equal(links.length, 1);
  assert.equal(nodes(env.harness.tree(), node => node.props?.id === 'admin-navigation').length, 1);
  env.harness.cleanup();
  assert.equal(env.listeners.size, 0);
});