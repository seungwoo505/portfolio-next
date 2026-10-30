const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
// 실제 라이브러리를 DOM 없는 Node 환경에서 먼저 읽고, 아래에서는 제품 이벤트 경계만 실행한다.
require('@headlessui/react');
const { createHarness, loadWithMocks, nodes } = require('./helpers/react-harness.cjs');

const source = name => path.resolve(__dirname, '../src', name);
const toast = { success() {}, error() {} };
const event = { preventDefault() {} };

function deferred() {
  let resolve;
  const promise = new Promise(res => { resolve = res; });
  return { promise, resolve };
}

function setup(t, api = {}) {
  const harness = createHarness();
  const previous = { document: global.document, window: global.window };
  global.document = { body: { style: {} }, addEventListener() {}, removeEventListener() {} };
  global.window = { setTimeout: () => 1, clearTimeout() {} };
  t.after(() => { harness.cleanup(); Object.assign(global, previous); });
  return {
    harness,
    mocks: {
      react: harness.react,
      'react-hot-toast': toast,
      '@/lib/api': { authApi: api },
    },
  };
}

const field = (harness, id) => nodes(harness.tree(), node => node.props?.id === id)[0];
const fill = async (harness, id, value) => {
  field(harness, id).props.onChange({ target: { value } });
  await harness.flush();
};
const submit = harness => nodes(harness.tree(), node => node.type === 'form')[0].props.onSubmit(event);

const cases = [
  {
    name: '확인', file: 'components/ConfirmModal.tsx',
    props: pending => ({ title: '삭제 확인', message: '삭제할까요?', onConfirm: () => pending.promise }),
    prepare: async () => {},
    start: harness => nodes(harness.tree(), node => node.type === 'button' && node.props.children === '확인')[0].props.onClick(),
    success: undefined,
  },
  {
    name: '새 사용자', file: 'app/admin/users/components/NewUserModal.tsx',
    props: () => ({ onUserCreated() {} }),
    prepare: async harness => {
      await fill(harness, 'user-username', 'fixture-admin');
      await fill(harness, 'user-email', 'fixture@example.invalid');
      await fill(harness, 'user-password', 'fixture-password-123');
      await fill(harness, 'user-confirm-password', 'fixture-password-123');
    },
    start: submit,
    success: { success: true, data: { id: 'fixture-user' } },
  },
  {
    name: '태그', file: 'app/admin/tags/components/TagModal.tsx',
    props: () => ({ onTagSaved() {} }),
    prepare: async harness => fill(harness, 'tag-name', 'fixture tag'),
    start: submit,
    success: { success: true, data: { id: 'fixture-tag' } },
  },
  {
    name: '기술', file: 'app/admin/skills/components/SkillModal.tsx',
    props: pending => ({ onSave: () => pending.promise, categories: [{ id: 'frontend', name: '프론트엔드' }] }),
    prepare: async harness => {
      await fill(harness, 'skill-name', 'React');
      await fill(harness, 'skill-category', 'frontend');
    },
    start: submit,
    success: { success: true },
  },
];

for (const modal of cases) {
  test(`${modal.name} 모달은 저장 중 닫기 요청을 무시하고 완료 후 닫힌다`, async t => {
    const pending = deferred();
    let closed = 0;
    let requests = 0;
    const request = () => { requests++; return pending.promise; };
    const { harness, mocks } = setup(t, { post: request, put: request });
    const props = modal.props(pending);
    if (props.onConfirm) props.onConfirm = request;
    if (props.onSave) props.onSave = request;
    harness.mount(loadWithMocks(source(modal.file), mocks).default, {
      isOpen: true, onClose() { closed++; }, ...props,
    });
    await harness.flush();
    await modal.prepare(harness);
    // Dialog의 공개 닫기 콜백만 호출하며 라이브러리의 포커스 구현은 렌더링하거나 모의하지 않는다.
    assert.equal(typeof harness.tree().props.onClose, 'function', '모달의 바깥 클릭/Escape 닫기 경계가 필요하다');
    const saving = modal.start(harness);
    await harness.flush();
    harness.tree().props.onClose(false);
    const closeButtons = nodes(harness.tree(), node => node.type === 'button' && (
      node.props['aria-label']?.includes('닫기') || node.props.children === '취소'
    ));
    assert.ok(closeButtons.length >= 2);
    assert.ok(closeButtons.every(button => button.props.disabled));
    assert.equal(closed, 0);
    const busySubmit = modal.name === '확인'
      ? nodes(harness.tree(), node => node.type === 'button' && node.props.children === '처리 중...')[0].props.onClick()
      : modal.start(harness);
    await busySubmit;
    assert.equal(requests, 1, '진행 중에는 중복 저장을 시작하지 않는다');
    pending.resolve(modal.success);
    await saving;
    await harness.flush();
    assert.equal(closed, 1);
    harness.tree().props.onClose(false);
    assert.equal(closed, 2, '저장이 끝나면 일반 닫기 요청을 다시 허용한다');
  });
}

for (const editing of [false, true]) {
  test(`기술 ${editing ? '수정' : '추가'}의 연속 저장 옵션은 성공 후 모달을 유지한다`, async t => {
    let closed = 0;
    const { harness, mocks } = setup(t);
    harness.mount(loadWithMocks(source('app/admin/skills/components/SkillModal.tsx'), mocks).default, {
      isOpen: true, onClose() { closed++; }, keepOpenOnSuccess: true,
      categories: [{ id: 'frontend', name: '프론트엔드' }],
      skill: editing ? { id: 'react', name: 'React', category_id: 'frontend', proficiency_level: 0, is_featured: false } : null,
      onSave: async () => ({ success: true }),
    });
    await harness.flush();
    if (!editing) {
      await fill(harness, 'skill-name', 'React');
      await fill(harness, 'skill-category', 'frontend');
    }
    await submit(harness);
    await harness.flush();
    assert.equal(closed, 0);
    assert.equal(field(harness, 'skill-name').props.value, editing ? 'React' : '');
    assert.equal(field(harness, 'skill-category').props.value, editing ? 'frontend' : '');
    assert.equal(field(harness, 'skill-proficiency').props.value, editing ? 0 : 50);
  });
}
