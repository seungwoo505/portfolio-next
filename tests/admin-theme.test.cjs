const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes } = require('./helpers/react-harness.cjs');

for (const initiallyDark of [false, true]) {
  test(`관리자 테마는 저장소가 거부되어도 ${initiallyDark ? '라이트' : '다크'}로 전환하고 색상 토큰을 덮어쓰지 않는다`, async t => {
    const harness = createHarness();
    const previous = { document: global.document, localStorage: global.localStorage };
    const classes = new Set(initiallyDark ? ['dark'] : []);
    const attributes = { 'data-theme': initiallyDark ? 'dark' : 'light' };
    const colorOverrides = {};
    const root = {
      getAttribute: key => attributes[key],
      setAttribute: (key, value) => { attributes[key] = value; },
      classList: {
        contains: key => classes.has(key),
        toggle(key, enabled) { if (enabled) classes.add(key); else classes.delete(key); },
      },
      style: { setProperty: (key, value) => { colorOverrides[key] = value; } },
    };
    global.document = { documentElement: root, cookie: '' };
    global.localStorage = { setItem() { throw new Error('저장소 거부'); } };
    t.after(() => { harness.cleanup(); Object.assign(global, previous); });
    const noop = () => null;
    const Header = loadWithMocks(path.resolve(__dirname, '../src/app/admin/components/AdminHeader.tsx'), {
      react: harness.react,
      'next/link': noop,
      'next/navigation': { useRouter: () => ({ push() {} }), usePathname: () => '/admin' },
      '@/contexts/AdminContext': { useAdmin: () => ({ user: { username: 'fixture' }, logout: async () => {} }) },
      '@/components/ui/button': { Button: noop },
      'lucide-react': { LogOut: noop, ArrowLeft: noop, Menu: noop, Moon: noop, Sun: noop },
    }).default;
    harness.mount(Header);
    await harness.flush();
    const label = initiallyDark ? '라이트 모드로 전환' : '다크 모드로 전환';
    assert.doesNotThrow(() => nodes(harness.tree(), node => node.props?.['aria-label'] === label)[0].props.onClick());
    await harness.flush();
    const expectedTheme = initiallyDark ? 'light' : 'dark';
    assert.equal(classes.has('dark'), !initiallyDark);
    assert.equal(attributes['data-theme'], expectedTheme);
    assert.equal(root.style.colorScheme, expectedTheme);
    assert.match(document.cookie, new RegExp(`theme=${expectedTheme};`));
    assert.deepEqual(colorOverrides, {});
    assert.equal(root.style.backgroundColor, undefined);
    assert.equal(root.style.color, undefined);
  });
}
