const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes } = require('./helpers/react-harness.cjs');

function setup(t, { reduced = false, customReduced = false } = {}) {
  const harness = createHarness();
  const listeners = new Map();
  const mediaListeners = new Map();
  const fontListeners = new Map();
  const animations = [];
  let pathname = '/';
  let offset = 0;
  let resized;
  let mutated;
  const classes = new Set(customReduced ? ['reduced-motion'] : []);
  const media = { matches: reduced, addEventListener: (name, fn) => mediaListeners.set(name, fn), removeEventListener: name => mediaListeners.delete(name) };
  const indicator = { style: {}, animate(frames, options) { const animation = { frames, options, cancelled: false, cancel() { this.cancelled = true; } }; animations.push(animation); return animation; } };
  const nav = {
    getBoundingClientRect: () => ({ left: 100, width: 400 }),
    querySelector: () => pathname === '/missing' ? null : { getBoundingClientRect: () => ({ left: pathname.startsWith('/projects') ? 180 + offset : 108 + offset, width: pathname.startsWith('/projects') ? 90 : 60 }) },
  };
  const previous = Object.fromEntries(['window', 'document', 'ResizeObserver', 'MutationObserver', 'getComputedStyle'].map(key => [key, global[key]]));
  global.window = { matchMedia: () => media, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  global.document = {
    hidden: false,
    documentElement: { classList: { contains: name => classes.has(name) } },
    fonts: { ready: Promise.resolve(), addEventListener: (name, fn) => fontListeners.set(name, fn), removeEventListener: name => fontListeners.delete(name) },
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name),
  };
  global.ResizeObserver = class { constructor(fn) { resized = fn; } observe() {} disconnect() {} };
  global.MutationObserver = class { constructor(fn) { mutated = fn; } observe() {} disconnect() {} };
  global.getComputedStyle = node => node.style;
  const noop = () => null;
  const Header = loadWithMocks(path.resolve(__dirname, '../src/components/Header.tsx'), {
    react: { ...harness.react, useLayoutEffect: harness.react.useEffect },
    './site/brand-motion.css': {},
    'next/navigation': { usePathname: () => pathname },
    'next/link': noop,
    'lucide-react': { ArrowUpRight: noop, Menu: noop, Moon: noop, Sun: noop, X: noop },
  }).default;
  const render = () => {
    const tree = Header();
    const navigation = nodes(tree, node => node.props?.['aria-label'] === '주요 메뉴')[0];
    if (navigation.props.ref) navigation.props.ref.current = nav;
    const marker = nodes(tree, node => node.props?.['data-nav-indicator'] !== undefined)[0];
    if (marker?.props.ref) marker.props.ref.current = indicator;
    return tree;
  };
  t.after(() => { harness.cleanup(); Object.assign(global, previous); });
  return { harness, indicator, animations, media, classes, listeners, mediaListeners, fontListeners, resize: () => resized?.(), mutate: () => mutated?.(), offset(value) { offset = value; }, async render(route = pathname) { pathname = route; harness.mount(render); await harness.flush(); } };
}

test('메뉴 표시는 첫 위치를 즉시 맞추고 실제 경로 변경과 뒤로 이동을 연결한다', async t => {
  const env = setup(t);
  await env.render();
  assert.equal(env.indicator.style.transform, 'translateX(8px)');
  assert.equal(env.animations.length, 0);
  await env.render('/projects/one');
  assert.equal(env.indicator.style.transform, 'translateX(80px)');
  assert.equal(env.indicator.style.width, '90px');
  assert.equal(env.animations.length, 1);
  assert.equal(env.animations[0].cancelled, false);
  env.resize();
  assert.equal(env.animations[0].cancelled, false);
  assert.deepEqual(env.animations[0].frames, [{ transform: 'translateX(8px)', width: '60px' }, { transform: 'translateX(80px)', width: '90px' }]);
  await env.render('/');
  assert.equal(env.indicator.style.transform, 'translateX(8px)');
  assert.equal(env.animations.length, 2);
});

test('크기와 글꼴 변경은 활성 항목으로 즉시 보정하고 활성 항목이 없으면 표시를 지운다', async t => {
  const env = setup(t);
  await env.render();
  env.offset(14);
  env.resize();
  assert.equal(env.indicator.style.transform, 'translateX(22px)');
  env.offset(20);
  env.fontListeners.get('loadingdone')?.();
  assert.equal(env.indicator.style.transform, 'translateX(28px)');
  assert.equal(env.animations.length, 0);
  await env.render('/missing');
  assert.equal(env.indicator.style.visibility, 'hidden');
});

for (const preference of [{ reduced: true }, { customReduced: true }]) {
  test(`감소 모션 ${JSON.stringify(preference)}은 위치를 맞추되 이동하지 않는다`, async t => {
    const env = setup(t, preference);
    await env.render();
    await env.render('/projects');
    assert.equal(env.indicator.style.transform, 'translateX(80px)');
    assert.equal(env.animations.length, 0);
  });
}

test('움직이는 중 감소 모션 또는 비활성 탭이면 애니메이션을 취소하고 현재 위치를 유지한다', async t => {
  const env = setup(t);
  await env.render();
  await env.render('/projects');
  assert.equal(env.animations.length, 1);
  env.media.matches = true;
  env.mediaListeners.get('change')?.();
  assert.equal(env.animations[0].cancelled, true);
  assert.equal(env.indicator.style.transform, 'translateX(80px)');
  env.media.matches = false;
  await env.render('/');
  global.document.hidden = true;
  env.listeners.get('visibilitychange')?.();
  assert.equal(env.animations.at(-1).cancelled, true);
});

function heroSetup(t, { reduced = false, customReduced = false, desktop = true } = {}) {
  const harness = createHarness();
  const animations = [];
  const listeners = new Map();
  const mediaListeners = new Map();
  const classes = new Set(customReduced ? ['reduced-motion'] : []);
  const preference = { matches: reduced, addEventListener: (name, fn) => mediaListeners.set(name, fn), removeEventListener: name => mediaListeners.delete(name) };
  let mutation;
  const previous = Object.fromEntries(['window', 'document', 'MutationObserver'].map(key => [key, global[key]]));
  global.window = { matchMedia: query => query.includes('reduced') ? preference : { matches: desktop } };
  global.document = { hidden: false, documentElement: { classList: { contains: name => classes.has(name) } }, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  global.MutationObserver = class { constructor(fn) { mutation = fn; } observe() {} disconnect() {} };
  const line = { animate(frames, options) { const animation = { frames, options, cancelled: false, cancel() { this.cancelled = true; } }; animations.push(animation); return animation; } };
  const noop = () => null;
  const Hero = loadWithMocks(path.resolve(__dirname, '../src/app/components/home/HomeHeroSection.tsx'), {
    react: harness.react,
    '@/components/site/brand-motion.css': {},
    'next/link': noop,
    'lucide-react': { ArrowDown: noop, ArrowUpRight: noop },
    '@/components/site/Container': { Container: noop },
  }).default;
  const render = () => {
    const tree = Hero({ displayName: '로컬', displayDescription: '본문', titleWords: [] });
    const pathNode = nodes(tree, node => node.props?.['data-hero-line'] !== undefined)[0];
    if (pathNode?.props.ref) pathNode.props.ref.current = line;
    return tree;
  };
  t.after(() => { harness.cleanup(); Object.assign(global, previous); });
  return { harness, animations, classes, mediaListeners, mutate: () => mutation?.(), async render() { harness.mount(render); await harness.flush(); } };
}

test('Hero 도식 선은 첫 렌더에서만 완성 방향으로 한 번 그린다', async t => {
  const env = heroSetup(t);
  await env.render();
  assert.equal(env.animations.length, 1);
  assert.deepEqual(env.animations[0].frames, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }]);
  assert.equal(env.animations[0].options.duration, 650);
  assert.equal(env.animations[0].options.iterations || 1, 1);
  await env.render();
  assert.equal(env.animations.length, 1);
});

for (const options of [{ reduced: true }, { customReduced: true }, { desktop: false }]) {
  test(`Hero ${JSON.stringify(options)} 환경에서는 기본 정지 상태를 유지한다`, async t => {
    const env = heroSetup(t, options);
    await env.render();
    assert.equal(env.animations.length, 0);
  });
}

test('Hero 도중 사용자 감소 모션을 켜면 취소하고 해제 후에도 반복하지 않는다', async t => {
  const env = heroSetup(t);
  await env.render();
  assert.equal(env.animations.length, 1);
  env.classes.add('reduced-motion');
  env.mutate();
  assert.equal(env.animations[0].cancelled, true);
  env.classes.delete('reduced-motion');
  env.mutate();
  await env.render();
  assert.equal(env.animations.length, 1);
});
