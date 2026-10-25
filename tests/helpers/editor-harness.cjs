const Module = require('node:module');
const React = require('react');

exports.loadWithDependencies = (filename, dependencies) => {
  const originalLoad = Module._load;
  Module._load = function (request, ...args) {
    return Object.hasOwn(dependencies, request)
      ? dependencies[request]
      : originalLoad.call(this, request, ...args);
  };
  try {
    delete require.cache[require.resolve(filename)];
    return require(filename);
  } finally {
    Module._load = originalLoad;
  }
};

// DOM이 필요한 BlockNote UI와 React 스케줄러만 대체하고 실제 컴포넌트를 실행한다.
exports.createEditorHarness = (editor, props) => {
  const hooks = [];
  let index = 0;
  let effects = [];
  const react = {
    ...React,
    useRef(value) {
      const slot = index++;
      return hooks[slot] ||= { current: value };
    },
    useState(value) {
      const slot = index++;
      if (!(slot in hooks)) hooks[slot] = value;
      return [hooks[slot], (next) => { hooks[slot] = next; }];
    },
    useEffect(effect, deps) {
      const slot = index++;
      if (!hooks[slot] || deps.some((dep, i) => dep !== hooks[slot][i])) {
        hooks[slot] = deps;
        effects.push(effect);
      }
    },
  };
  let created = false;
  const Component = exports.loadWithDependencies(
    '../../src/app/admin/components/BlockContentEditor.tsx',
    {
      react,
      '@blocknote/react': { useCreateBlockNote(options) {
        if (!created) editor.document = options.initialContent;
        created = true;
        return editor;
      } },
      '@blocknote/mantine': { BlockNoteView: 'blocknote-view' },
    }
  ).default;
  return {
    render() { index = 0; return Component(props); },
    flushEffects() { const pending = effects; effects = []; pending.forEach((effect) => effect()); },
  };
};
