const assert = require('node:assert/strict');
const test = require('node:test');
const { startSiteMotion } = require('../src/lib/site-motion.ts');

function environment(t, { reduced = false, supported = true } = {}) {
  const callbacks = {};
  const targets = [];
  const observed = new Set();
  const listeners = new Map();
  const media = { matches: reduced, addEventListener: (_name, fn) => { callbacks.preference = fn; }, removeEventListener: (_name, fn) => { if (callbacks.preference === fn) callbacks.preference = null; } };
  class IntersectionObserver {
    constructor(callback) { callbacks.intersection = callback; }
    observe(target) { observed.add(target); }
    unobserve(target) { observed.delete(target); }
    disconnect() { observed.clear(); }
  }
  class MutationObserver {
    constructor(callback) { callbacks.mutation = callback; }
    observe() {}
    disconnect() { callbacks.mutation = null; }
  }
  const root = {
    querySelectorAll: () => targets,
    contains: target => targets.includes(target),
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name); },
  };
  const previousWindow = globalThis.window;
  const previousIntersection = globalThis.IntersectionObserver;
  const previousMutation = globalThis.MutationObserver;
  globalThis.window = { innerHeight: 800, matchMedia: () => media };
  globalThis.IntersectionObserver = supported ? IntersectionObserver : undefined;
  globalThis.MutationObserver = supported ? MutationObserver : undefined;
  t.after(() => { globalThis.window = previousWindow; globalThis.IntersectionObserver = previousIntersection; globalThis.MutationObserver = previousMutation; });
  function element(top) {
    const animations = [];
    const target = {
      top,
      getBoundingClientRect: () => ({ top: target.top, bottom: target.top + 100 }),
      contains: value => value === target,
      matches: () => false,
      animate: (frames, options) => { const animation = { frames, options, cancelCount: 0, cancel() { this.cancelCount++; }, addEventListener() {} }; animations.push(animation); return animation; },
      animations,
    };
    targets.push(target);
    return target;
  }
  return { root, callbacks, targets, observed, listeners, media, element };
}

test('initially visible content stays immediately visible and does not restart an entrance', t => {
  const env = environment(t);
  const visible = env.element(100);
  const below = env.element(1000);
  const stop = startSiteMotion(env.root);
  assert.equal(visible.animations.length, 0);
  assert.equal(env.observed.has(visible), false);
  assert.equal(env.observed.has(below), true);
  stop();
});

test('a below-fold target enters only once, without delayed or persistent hidden styles', t => {
  const env = environment(t);
  const target = env.element(1000);
  const stop = startSiteMotion(env.root);
  const entry = { target, isIntersecting: true };
  assert.equal(typeof env.callbacks.intersection, 'function');
  target.top = 300;
  env.callbacks.intersection([entry]);
  env.callbacks.intersection([entry]);
  assert.equal(target.animations.length, 1);
  assert.equal(env.observed.has(target), false);
  assert.equal(target.animations[0].options.delay || 0, 0);
  assert.notEqual(target.animations[0].options.fill, 'forwards');
  assert.deepEqual(target.animations[0].frames.at(-1), { opacity: 1, transform: 'translateY(0px)' });
  stop();
});

test('new visible results use a brief opacity transition without moving the list', t => {
  const env = environment(t);
  const stop = startSiteMotion(env.root);
  const target = env.element(100);
  assert.equal(typeof env.callbacks.mutation, 'function');
  env.callbacks.mutation([{ addedNodes: [target], removedNodes: [] }]);
  assert.equal(target.animations.length, 1);
  assert.ok(target.animations[0].options.duration <= 180);
  assert.ok(target.animations[0].frames.every(frame => !frame.transform));
  stop();
});

for (const options of [{ reduced: true }, { supported: false }]) {
  test(`${options.reduced ? 'reduced motion' : 'missing observer support'} leaves every target visible without animation`, t => {
    const env = environment(t, options);
    const target = env.element(1000);
    const stop = startSiteMotion(env.root);
    env.callbacks.intersection?.([{ target, isIntersecting: true }]);
    assert.equal(target.animations.length, 0);
    stop();
  });
}

test('enabling reduced motion and unmounting cancel current motion and disconnect observers', t => {
  const env = environment(t);
  const target = env.element(1000);
  const stop = startSiteMotion(env.root);
  assert.equal(typeof env.callbacks.intersection, 'function');
  target.top = 300;
  env.callbacks.intersection([{ target, isIntersecting: true }]);
  env.media.matches = true;
  env.callbacks.preference({ matches: true });
  assert.equal(target.animations[0].cancelCount, 1);
  assert.equal(env.observed.size, 0);
  stop();
  assert.equal(env.callbacks.mutation, null);
  assert.equal(env.callbacks.preference, null);
});

test('keyboard focus cancels an entrance immediately so controls remain stable', t => {
  const env = environment(t);
  const target = env.element(1000);
  const stop = startSiteMotion(env.root);
  assert.equal(typeof env.callbacks.intersection, 'function');
  target.top = 300;
  env.callbacks.intersection([{ target, isIntersecting: true }]);
  env.listeners.get('focusin')({ target });
  assert.equal(target.animations[0].cancelCount, 1);
  stop();
});

test('FLIP 진행 중 도착한 진입 관측은 transform을 추가하거나 나중에 재실행하지 않는다', t => {
  const env = environment(t);
  const target = env.element(1000);
  const stop = startSiteMotion(env.root);
  try {
    target.top = 300;
    target.closest = () => ({ dataset: { layoutAnimating: 'true' } });
    env.callbacks.intersection([{ target, isIntersecting: true }]);
    assert.equal(target.animations.length, 0);
    target.closest = () => null;
    env.callbacks.intersection([{ target, isIntersecting: true }]);
    assert.equal(target.animations.length, 0);
    assert.equal(env.observed.has(target), false);
  } finally { stop(); }
});