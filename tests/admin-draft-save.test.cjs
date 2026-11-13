const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
require('@headlessui/react');
const { createHarness, loadWithMocks, nodes, textContent } = require('./helpers/react-harness.cjs');
const source = file => path.resolve(__dirname, '../src', file);
const toast = Object.assign(() => {}, { success() {}, error() {} });
function setup(t) {
  const harness = createHarness();
  const previous = { window: global.window, document: global.document };
  global.window = { setTimeout: () => 1, clearTimeout() {} };
  global.document = { body: { style: {} }, addEventListener() {}, removeEventListener() {} };
  t.after(() => { harness.cleanup(); Object.assign(global, previous); });
  return { harness, mocks: { react: harness.react, 'react-hot-toast': toast, '@/contexts/AdminContext': { useAdmin: () => ({ isAuthenticated: true, isLoading: false }) } } };
}
function button(harness, text) { return nodes(harness.tree(), node => node.type === 'button' && textContent(node).trim() === text)[0]; }
function field(harness, placeholder) { return nodes(harness.tree(), node => node.type === 'input' && node.props.placeholder === placeholder)[0]; }

for (const pendingChange of ['same-field', 'other-field', 'none', 'failure']) {
  test(`개인정보 저장은 응답보다 새로운 입력과 변경 상태를 보존한다: ${pendingChange}`, async t => {
    const { harness, mocks } = setup(t);
    let finish;
    let payload;
    const pending = new Promise(resolve => { finish = resolve; });
    const initial = { full_name: '기존 이름', title: '기존 직책' };
    const Page = loadWithMocks(source('app/admin/personal-info/page.tsx'), {
      ...mocks, '@/lib/api': { authApi: { get: async () => ({ success: true, data: initial }), put: async (_url, body) => { payload = body; return pending; } } },
    }).default;
    harness.mount(Page); await harness.flush();
    field(harness, '예: 홍길동').props.onChange({ target: { value: '첫 저장 이름' } }); await harness.flush();
    const save = nodes(harness.tree(), node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} }); await harness.flush();
    assert.equal(payload.full_name, '첫 저장 이름');
    if (pendingChange === 'same-field') field(harness, '예: 홍길동').props.onChange({ target: { value: '새로 입력한 이름' } });
    if (pendingChange === 'other-field') {
      const title = nodes(harness.tree(), node => node.type === 'input' && node.props.value === '기존 직책')[0];
      title.props.onChange({ target: { value: '새로 입력한 직책' } });
    }
    await harness.flush();
    finish(pendingChange === 'failure' ? { success: false, message: '저장 거부' } : { success: true, data: { ...payload, updated_at: '2030-01-01' } });
    await save; await harness.flush();
    assert.equal(field(harness, '예: 홍길동').props.value, pendingChange === 'same-field' ? '새로 입력한 이름' : '첫 저장 이름');
    if (pendingChange === 'other-field') assert.ok(nodes(harness.tree(), node => node.type === 'input' && node.props.value === '새로 입력한 직책').length);
    assert.equal(button(harness, '저장').props.disabled, pendingChange === 'none');
    if (pendingChange === 'none') assert.match(textContent(harness.tree()), /2030/);
  });
}

for (const text of ['', '  \n  ', '남기는 성과\n\n두 번째 성과']) {
  test(`경력 성과는 비어 있어도 명시적인 배열로 저장한다: ${JSON.stringify(text)}`, async t => {
    const { harness, mocks } = setup(t);
    let payload;
    const experience = { id: '1', title: '로컬 경력', company: '로컬 회사', achievements: ['이전 성과'] };
    const Page = loadWithMocks(source('app/admin/experiences/page.tsx'), {
      ...mocks, 'next/navigation': { useRouter: () => ({ push() {} }) },
      '@/lib/api': { authApi: { get: async () => ({ success: true, data: [experience] }), put: async (_url, body) => { payload = JSON.parse(JSON.stringify(body)); return { success: true }; } } },
    }).default;
    harness.mount(Page); await harness.flush();
    nodes(harness.tree(), node => node.props?.['aria-label'] === '로컬 경력 수정')[0].props.onClick(); await harness.flush();
    nodes(harness.tree(), node => node.props?.id === 'exp-achievements')[0].props.onChange({ target: { name: 'achievements', value: text } }); await harness.flush();
    const form = nodes(harness.tree(), node => node.type === 'form')[0];
    form.props.onSubmit({ preventDefault() {} }); await harness.flush();
    assert.deepEqual(payload.achievements, text.trim() ? ['남기는 성과', '두 번째 성과'] : []);
  });
}
