const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes } = require('./helpers/react-harness.cjs');

test('모바일 메뉴는 로고 이동과 native Back의 경로 변경 뒤 닫혀 탐색에서 제외된다', async t => {
  const harness = createHarness();
  const previous = { window: global.window, document: global.document };
  const noop = () => null;
  const media = { matches: false, addEventListener() {}, removeEventListener() {} };
  global.window = { matchMedia: () => media };
  global.document = { documentElement: { classList: { contains: () => false } }, addEventListener() {}, removeEventListener() {} };
  t.after(() => { harness.cleanup(); Object.assign(global, previous); });
  let pathname = '/about';
  const Header = loadWithMocks(path.resolve(__dirname, '../src/components/Header.tsx'), {
    react: { ...harness.react, useLayoutEffect: harness.react.useEffect },
    './site/brand-motion.css': {}, 'next/link': noop,
    'next/navigation': { usePathname: () => pathname },
    'lucide-react': { ArrowUpRight: noop, Menu: noop, Moon: noop, Sun: noop, X: noop },
  }).default;
  const menu = () => nodes(harness.tree(), node => node.props?.className === 'mobile-menu md:hidden')[0];
  const toggle = () => nodes(harness.tree(), node => node.type === 'button' && node.props?.['aria-controls'] === 'mobile-navigation')[0];
  harness.mount(Header); await harness.flush();
  for (const destination of ['/', '/projects']) {
    toggle().props.onClick(); await harness.flush();
    assert.equal(menu().props['aria-hidden'], false);
    pathname = destination; harness.mount(Header); await harness.flush();
    assert.equal(toggle().props['aria-expanded'], false, '새 경로에서 이전 메뉴가 열린 채 유지되면 안 된다');
    assert.equal(menu().props.inert, true);
    assert.equal(menu().props['aria-hidden'], true);
  }
});
