const Module = require('node:module');
const React = require('react');

// DOM renderer 설치 없이 실제 컴포넌트의 상태/효과/이벤트 경계를 실행한다.
function createHarness() {
  let cursor = 0;
  let dirty = false;
  let component;
  let props;
  let tree;
  const slots = [];
  const effects = [];
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const memo = (factory, deps) => {
    const index = cursor++;
    if (!slots[index] || !sameDeps(slots[index].deps, deps)) {
      slots[index] = { value: factory(), deps };
    }
    return slots[index].value;
  };
  const react = {
    ...React,
    Suspense: 'suspense',
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => {
        const next = typeof value === 'function' ? value(slots[index]) : value;
        if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true; }
      }];
    },
    useRef: initial => memo(() => ({ current: initial }), []),
    useMemo: memo,
    useCallback: (callback, deps) => memo(() => callback, deps),
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || !sameDeps(slots[index].deps, deps)) {
        const previous = slots[index];
        slots[index] = { deps, cleanup: previous?.cleanup };
        effects.push(() => {
          slots[index].cleanup?.();
          slots[index].cleanup = effect();
        });
      }
    },
  };
  return {
    react,
    mount(fn, input = {}) { component = fn; props = input; dirty = true; },
    async flush() {
      for (let i = 0; i < 30; i++) {
        if (dirty) { dirty = false; cursor = 0; tree = component(props); }
        while (effects.length) effects.shift()();
        await new Promise(resolve => setImmediate(resolve));
        if (!dirty && !effects.length) return tree;
      }
      throw new Error('컴포넌트 상태가 수렴하지 않습니다.');
    },
    tree: () => tree,
    cleanup() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}

function loadWithMocks(filename, mocks) {
  const original = Module._load;
  Module._load = function (request, parent, ...rest) {
    if (Object.hasOwn(mocks, request)) return mocks[request];
    return original.call(this, request, parent, ...rest);
  };
  try {
    delete require.cache[require.resolve(filename)];
    return require(filename);
  } finally { Module._load = original; }
}

function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(node => nodes(node, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}

function textContent(tree) {
  if (tree === null || tree === undefined || typeof tree === 'boolean') return '';
  if (typeof tree !== 'object') return String(tree);
  if (Array.isArray(tree)) return tree.map(textContent).join('');
  return textContent(tree.props?.children);
}

module.exports = { createHarness, loadWithMocks, nodes, textContent };
