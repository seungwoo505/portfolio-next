const assert = require('node:assert/strict');
const test = require('node:test');
const { canAnimateProjectLink, startProjectImageTransitions } = require('../src/lib/project-image-transition.ts');
const origin = 'http://127.0.0.1:4318';
function link(overrides = {}) {
  return { href: `${origin}/projects/${encodeURIComponent('테스트 작업')}`, target: '', dataset: { projectLink: '테스트 작업' }, hasAttribute: () => false, ...overrides };
}
const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false };
test('plain internal project links can connect the actual image without taking over navigation', () => {
  assert.equal(canAnimateProjectLink(click, link(), origin), true);
});
test('modifier, secondary and prevented clicks keep their native browser behavior', () => {
  for (const change of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { button: 2 }, { defaultPrevented: true }]) {
    assert.equal(canAnimateProjectLink({ ...click, ...change }, link(), origin), false);
  }
});
test('new-tab, download, external and mismatched project links never start a transition', () => {
  for (const anchor of [link({ target: '_blank' }), link({ hasAttribute: name => name === 'download' }), link({ href: 'https://example.invalid/projects/a' }), link({ href: `${origin}/contact` }), link({ dataset: { projectLink: 'other' } }), link({ href: `${origin}/projects/%broken` }), link({ href: `${origin}/projects/${encodeURIComponent('테스트 작업')}#section` })]) {
    assert.equal(canAnimateProjectLink(click, anchor, origin), false);
  }
});
test('unsupported and server rendering environments need no DOM mutation or navigation fallback', () => {
  const stop = startProjectImageTransitions({});
  assert.equal(typeof stop, 'function');
  assert.doesNotThrow(stop);
});
