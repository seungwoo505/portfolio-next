const assert = require('node:assert/strict');
const test = require('node:test');
const { startProjectImageTransitions } = require('../src/lib/project-image-transition.ts');

function environment(t) {
  const previous = Object.fromEntries(['window', 'Element', 'MutationObserver'].map(key => [key, global[key]]));
  const overlays = [], observers = [], timers = new Map(), frames = new Map();
  let nextId = 0, images = [];
  const events = () => ({
    listeners: new Map(),
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); },
    removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); },
    emit(type, event = {}) { for (const fn of [...(this.listeners.get(type) || [])]) fn(event); },
  });
  class ElementMock {
    constructor() { this.style = { opacity: '' }; this.dataset = {}; this.isConnected = true; this.children = []; }
    setAttribute() {}
    hasAttribute() { return false; }
    append(child) { this.children.push(child); }
    remove() { this.isConnected = false; const index = overlays.indexOf(this); if (index >= 0) overlays.splice(index, 1); }
    animate(keyframes, options) {
      const animation = { ...events(), keyframes, options, cancelCount: 0, cancel() { this.cancelCount++; this.emit('cancel'); } };
      this.animation = animation;
      return animation;
    }
  }
  global.Element = ElementMock;
  global.MutationObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  };
  const doc = {
    ...events(), documentElement: {}, hidden: false,
    body: { append(element) { overlays.push(element); } },
    createElement() { return new ElementMock(); },
  };
  const root = Object.assign(new ElementMock(), events(), {
    ownerDocument: doc,
    closest() { return null; },
    contains(element) { return element.insideRoot === true || images.includes(element); },
    querySelectorAll() { return images; },
  });
  const view = {
    ...events(), location: { origin: 'http://127.0.0.1:4318', pathname: '/projects', href: 'http://127.0.0.1:4318/projects' },
    innerWidth: 1280, innerHeight: 800,
    matchMedia() { return { ...events(), matches: false }; },
    getComputedStyle(element) { return { borderRadius: '0px', backgroundColor: 'white', objectFit: 'cover', objectPosition: 'center', scale: element.computedScale || '1' }; },
    setTimeout(callback, delay) { const id = ++nextId; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame(callback) { const id = ++nextId; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  global.window = view;
  function image(key, role = 'list', scale = '1') {
    const content = Object.assign(new ElementMock(), { complete: true, naturalWidth: 400, currentSrc: 'http://127.0.0.1:4318/test.jpg', computedScale: scale });
    const element = Object.assign(new ElementMock(), {
      dataset: { projectImage: key, projectImageRole: role },
      getBoundingClientRect() { return { left: 40, top: 100, width: 400, height: 250, bottom: 350, right: 440 }; },
      querySelector() { return content; },
    });
    return element;
  }
  function link(key, { pathname = `/projects/${key}`, insideRoot = true, project = true } = {}) {
    const anchor = Object.assign(new ElementMock(), {
      href: `${view.location.origin}${pathname}`, target: '', insideRoot,
      dataset: project ? { projectLink: key } : {},
      closest(selector) {
        if (selector.includes('data-project-card')) return { querySelectorAll: () => images.filter(item => item.dataset.projectImage === key) };
        if (selector.includes('data-project-link') && !project) return null;
        return this;
      },
    });
    return anchor;
  }
  const stop = startProjectImageTransitions(root);
  t.after(() => { stop(); Object.assign(global, previous); });
  return {
    root, view, overlays, timers, image, link, stop,
    setImages(next) { images = next; },
    navigate(pathname) { view.location.pathname = pathname; view.location.href = `${view.location.origin}${pathname}`; },
    click(anchor) {
      const event = { target: anchor, button: 0, defaultPrevented: false, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
      if (anchor.insideRoot) root.emit('click', event);
      doc.emit('click', event);
    },
    mutate() { for (const observer of observers) if (!observer.disconnected) observer.callback([]); },
    flushFrames() { for (let pass = 0; pass < 5 && frames.size; pass++) { const current = [...frames.values()]; frames.clear(); current.forEach(callback => callback()); } },
  };
}

test('프로젝트 준비 중 헤더의 일반 동일 탭 탐색은 이전 overlay를 즉시 정리한다', t => {
  const env = environment(t);
  env.setImages([env.image('a')]);
  env.click(env.link('a'));
  assert.equal(env.overlays.length, 1);
  env.click(env.link('', { pathname: '/about', insideRoot: false, project: false }));
  assert.equal(env.overlays.length, 0);
  assert.equal(env.timers.size, 0);
});

test('프로젝트 대기 중 다른 URL이 확정되면 DOM 변경에서 오래된 overlay를 정리한다', t => {
  const env = environment(t);
  env.setImages([env.image('a')]);
  env.click(env.link('a'));
  env.navigate('/about');
  env.setImages([]);
  env.mutate();
  assert.equal(env.overlays.length, 0);
  assert.equal(env.timers.size, 0);
});

test('진행 중인 이미지 연결을 취소하거나 언마운트하면 대상의 원래 opacity를 복원한다', t => {
  const env = environment(t);
  function begin() {
    env.navigate('/projects');
    env.setImages([env.image('a')]);
    env.click(env.link('a'));
    const target = env.image('a', 'detail');
    target.style.opacity = '.7';
    env.setImages([target]);
    env.navigate('/projects/a');
    env.mutate();
    env.flushFrames();
    assert.equal(target.style.opacity, '0');
    return target;
  }
  const first = begin();
  env.view.emit('resize');
  assert.equal(first.style.opacity, '.7');
  assert.equal(env.overlays.length, 0);
  const second = begin();
  env.stop();
  assert.equal(second.style.opacity, '.7');
  assert.equal(env.overlays.length, 0);
  assert.equal(env.timers.size, 0);
});

test('빠른 A에서 B 전환 뒤 A의 오래된 타이머는 B의 overlay를 지우지 않는다', t => {
  const env = environment(t);
  env.setImages([env.image('a'), env.image('b')]);
  env.click(env.link('a'));
  const oldTimer = [...env.timers.values()][0].callback;
  env.click(env.link('b'));
  const currentOverlay = env.overlays[0];
  assert.equal(env.overlays.length, 1);
  oldTimer();
  assert.equal(env.overlays.length, 1);
  assert.equal(env.overlays[0], currentOverlay);
});

test('A 애니메이션의 늦은 완료 이벤트는 이후 B 대기를 취소하지 않는다', t => {
  const env = environment(t);
  env.setImages([env.image('a')]);
  env.click(env.link('a'));
  env.setImages([env.image('a', 'detail')]);
  env.navigate('/projects/a');
  env.mutate();
  env.flushFrames();
  const oldAnimation = env.overlays[0].animation;
  assert.ok(oldAnimation);
  env.navigate('/projects');
  env.setImages([env.image('b')]);
  env.click(env.link('b'));
  const currentOverlay = env.overlays[0];
  oldAnimation.emit('finish');
  oldAnimation.emit('cancel');
  assert.equal(env.overlays.length, 1);
  assert.equal(env.overlays[0], currentOverlay);
});

test('확대된 카드 이미지는 현재 크롭에서 시작해 상세 크롭으로 이어지고 취소 시 함께 정리된다', t => {
  const env = environment(t);
  env.setImages([env.image('a', 'list', '1.015')]);
  env.click(env.link('a'));
  const clone = env.overlays[0].children[0];
  assert.equal(clone.style.scale, '1.015', 'hover 확대 상태가 첫 프레임에서 축소되면 안 된다');
  const target = env.image('a', 'detail', '1');
  env.setImages([target]); env.navigate('/projects/a'); env.mutate(); env.flushFrames();
  assert.deepEqual(clone.animation.keyframes, [{ scale: '1.015' }, { scale: '1' }]);
  assert.equal(clone.animation.options.duration, 380);
  env.view.emit('resize');
  assert.equal(clone.animation.cancelCount, 1);
  assert.equal(target.style.opacity, '');
  assert.equal(env.overlays.length, 0);
});
