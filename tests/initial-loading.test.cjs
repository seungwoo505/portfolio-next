const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes } = require('./helpers/react-harness.cjs');
const source = name => path.resolve(__dirname, '../src', name);
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }

test('푸터는 설정과 프로필을 동시에 요청하고 기존 설정 우선 병합을 유지한다', async t => {
  const harness = createHarness(), settings = deferred(), profile = deferred(), calls = [];
  const Footer = loadWithMocks(source('components/Footer.tsx'), {
    react: harness.react, 'next/link': 'a',
    '@/lib/api': { api: { get: () => { calls.push('settings'); return settings.promise; } }, personalApi: { getPersonalInfo: () => { calls.push('profile'); return profile.promise; } } },
  }).default;
  harness.mount(Footer); await harness.flush(); t.after(() => harness.cleanup());
  assert.deepEqual(calls, ['settings', 'profile']);
  profile.resolve({ success: true, data: { bio: '프로필 소개', email: 'profile@example.invalid' } });
  settings.resolve({ success: true, data: { personal_bio: '설정 소개', personal_email: 'settings@example.invalid' } });
  await harness.flush();
  assert.ok(nodes(harness.tree(), node => node.type === 'a' && node.props.href === 'mailto:settings@example.invalid').length);
  assert.ok(nodes(harness.tree(), node => node.type === 'p' && node.props.children === '설정 소개').length);
});
