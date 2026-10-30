const assert = require('node:assert/strict');
const test = require('node:test');
const { startListMotion } = require('../src/lib/list-motion.ts');
const { startSiteMotion } = require('../src/lib/site-motion.ts');

function environment(t, { reduced = false, classReduced = false } = {}) {
  const previous = { window: global.window, MutationObserver: global.MutationObserver, ResizeObserver: global.ResizeObserver };
  const listeners = new Map(), callbacks = {};
  const media = { matches: reduced, addEventListener: (_type, fn) => { callbacks.preference = fn; }, removeEventListener: () => { callbacks.preference = null; } };
  const view = { scrollX: 0, scrollY: 0, matchMedia: () => media, addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type) };
  global.window = view;
  global.MutationObserver = class { constructor(fn) { callbacks.classChange = fn; } observe() {} disconnect() { callbacks.classChange = null; } };
  global.ResizeObserver = class { constructor(fn) { callbacks.resize = fn; } observe() {} disconnect() { callbacks.resize = null; } };
  const root = { clientWidth: 1000, children: [], dataset: {}, ownerDocument: { documentElement: {}, body: {}, activeElement: null }, reduced: classReduced, closest: () => root.reduced ? root : null, addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type) };
  function card(id, left, top) {
    const animations = [];
    const element = { dataset: { layoutId: id }, left, top, shiftX: 0, shiftY: 0, animations,
      getBoundingClientRect: () => ({ left: element.left - view.scrollX + element.shiftX, top: element.top - view.scrollY + element.shiftY }),
      contains: () => false,
      getAnimations: () => animations.filter(animation => !animation.cancelCount),
      animate(frames, options) {
        const events = {};
        const animation = { frames, options, cancelCount: 0, addEventListener(type, fn) { events[type] = fn; }, finish() { element.shiftX = element.shiftY = 0; events.finish?.(); }, cancel() { this.cancelCount++; element.shiftX = element.shiftY = 0; events.cancel?.(); } };
        animations.push(animation);
        return animation;
      },
    };
    root.children.push(element);
    return element;
  }
  t.after(() => Object.assign(global, previous));
  return { root, card, view, callbacks, media, listeners };
}

test('카드 초기 진입과 신규 카드는 맡기고 기존 카드 위치만 즉시 FLIP한다', t => {
  const env = environment(t);
  const first = env.card('first', 0, 100), second = env.card('second', 300, 100);
  const motion = startListMotion(env.root);
  assert.equal(first.animations.length, 0);
  env.root.children = [second];
  second.left = 0;
  const added = env.card('new', 300, 100);
  motion.update();
  assert.equal(env.root.children[0], second);
  assert.equal(first.animations.length, 0);
  assert.equal(added.animations.length, 0);
  assert.equal(second.animations.length, 1);
  assert.deepEqual(second.animations[0].frames, [{ transform: 'translate(300px, 0px)' }, { transform: 'translate(0px, 0px)' }]);
  assert.equal(second.animations[0].options.duration, 240);
  assert.equal(env.root.dataset.layoutAnimating, 'true');
  second.animations[0].finish();
  assert.equal(env.root.dataset.layoutAnimating, undefined);
  motion.stop();
});

test('스크롤만 바뀌면 움직이지 않고 스크롤 후 카드 재배치 거리도 정확하다', t => {
  const env = environment(t);
  const item = env.card('item', 300, 500);
  const motion = startListMotion(env.root);
  env.view.scrollY = 300;
  motion.update();
  assert.equal(item.animations.length, 0);
  item.left = 0;
  item.top = 200;
  motion.update();
  assert.equal(item.animations[0].frames[0].transform, 'translate(300px, 300px)');
  motion.stop();
});

test('빠른 재필터는 이전 모션을 취소하고 현재 화면 위치에서 이어진다', t => {
  const env = environment(t);
  const item = env.card('item', 300, 100);
  const motion = startListMotion(env.root);
  item.left = 0;
  motion.update();
  item.shiftX = 120;
  item.left = 600;
  motion.update();
  assert.equal(item.animations[0].cancelCount, 1);
  assert.equal(item.animations[1].frames[0].transform, 'translate(-480px, 0px)');
  assert.equal(env.root.dataset.layoutAnimating, 'true');
  motion.stop();
  assert.equal(item.animations[1].cancelCount, 1);
  assert.equal(env.root.dataset.layoutAnimating, undefined);
  assert.equal(env.listeners.size, 0);
  assert.equal(env.callbacks.preference, null);
});

test('리사이즈는 진행 모션을 취소하고 새 배치를 기준으로 갱신한다', t => {
  const env = environment(t);
  const item = env.card('item', 300, 100);
  const motion = startListMotion(env.root);
  item.left = 0;
  motion.update();
  item.top = 400;
  env.root.clientWidth = 500;
  env.callbacks.resize();
  assert.equal(item.animations[0].cancelCount, 1);
  motion.update();
  assert.equal(item.animations.length, 1);
  item.top = 100;
  motion.update();
  assert.equal(item.animations[1].frames[0].transform, 'translate(0px, 300px)');
  motion.stop();
});

for (const options of [{ reduced: true }, { classReduced: true }]) test(`감소 모션 ${JSON.stringify(options)}은 결과를 즉시 표시한다`, t => {
  const env = environment(t, options);
  const item = env.card('item', 300, 100);
  const motion = startListMotion(env.root);
  item.left = 0;
  motion.update();
  assert.equal(item.animations.length, 0);
  assert.equal(env.root.dataset.layoutAnimating, undefined);
  motion.stop();
});

test('실행 중 감소 모션을 켜면 애니메이션과 표식을 즉시 정리한다', t => {
  const env = environment(t);
  const item = env.card('item', 300, 100);
  const motion = startListMotion(env.root);
  item.left = 0;
  motion.update();
  env.media.matches = true;
  env.callbacks.preference();
  assert.equal(item.animations[0].cancelCount, 1);
  assert.equal(env.root.dataset.layoutAnimating, undefined);
  motion.stop();
});


test('실행 중 앱 감소 모션을 켜거나 제거된 카드를 정리하면 표식이 남지 않는다', t => {
  const env = environment(t);
  const item = env.card('item', 300, 100);
  const motion = startListMotion(env.root);
  item.left = 0;
  motion.update();
  env.root.reduced = true;
  env.callbacks.classChange();
  assert.equal(item.animations[0].cancelCount, 1);
  assert.equal(env.root.dataset.layoutAnimating, undefined);
  env.root.reduced = false;
  item.left = 300;
  motion.update();
  env.root.children = [];
  motion.update();
  assert.equal(item.animations[1].cancelCount, 1);
  assert.equal(env.root.dataset.layoutAnimating, undefined);
  motion.stop();
  assert.equal(env.callbacks.resize, null);
  assert.equal(env.callbacks.classChange, null);
});

test('카드 진입 중 재배치는 진입만 취소한 뒤 원래 배치에서 FLIP하고 다른 애니메이션을 보존한다', t => {
  const env = environment(t);
  const previousIntersection = global.IntersectionObserver;
  let intersect;
  global.IntersectionObserver = class {
    constructor(callback) { intersect = callback; }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  t.after(() => { global.IntersectionObserver = previousIntersection; });
  env.view.innerHeight = 800;
  env.root.querySelectorAll = () => env.root.children;
  env.root.contains = target => env.root.children.includes(target);
  const item = env.card('item', 0, 1000);
  const motion = startListMotion(env.root);
  const stopSite = startSiteMotion(env.root);
  try {
    env.view.scrollY = 700;
    intersect([{ target: item, isIntersecting: true }]);
    const entrance = item.animations[0];
    assert.equal(entrance.options.duration, 380);
    item.shiftY = 6; // 첫 진입이 진행 중인 화면 위치를 재현한다.
    const unrelated = item.animate([{ opacity: 1 }, { opacity: .9 }], { duration: 900 });
    item.top = 600;
    motion.update();
    assert.equal(entrance.cancelCount, 1, '진입 transform은 FLIP 위치를 측정하기 전에 취소한다');
    assert.equal(unrelated.cancelCount, 0, '이 모션이 소유하지 않은 애니메이션은 건드리지 않는다');
    const layout = item.animations.at(-1);
    assert.equal(layout.options.duration, 240);
    assert.equal(layout.frames[0].transform, 'translate(0px, 400px)');
    assert.equal(item.getAnimations().filter(animation => [240, 380].includes(animation.options.duration)).length, 1);
  } finally {
    stopSite();
    motion.stop();
  }
});

test('getAnimations가 없는 환경에서도 기존 카드 재배치는 계속 동작한다', t => {
  const env = environment(t);
  const item = env.card('item', 300, 100);
  delete item.getAnimations;
  const motion = startListMotion(env.root);
  try {
    item.left = 0;
    assert.doesNotThrow(() => motion.update());
    assert.equal(item.animations[0].frames[0].transform, 'translate(300px, 0px)');
  } finally { motion.stop(); }
});