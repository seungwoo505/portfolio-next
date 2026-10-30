const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes, textContent } = require('./helpers/react-harness.cjs');

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function setup(t, { enabled = true } = {}) {
  const harness = createHarness();
  const pending = deferred();
  const sent = [], notices = [];
  const page = loadWithMocks(path.resolve(__dirname, '../src/app/(site)/contact/page.tsx'), {
    react: harness.react,
    '@/lib/api': { api: { get: async () => ({ data: { contact_enabled: enabled } }) }, contactApi: { sendMessage: body => { sent.push(body); return pending.promise; } } },
    '@/components/ScrollProgress': () => null,
    '@/components/ui/button': { Button: 'button' },
    'react-hot-toast': { success: message => notices.push(['success', message]), error: message => notices.push(['error', message]) },
    './contact-feedback.css': {},
  }).default;
  t.after(() => harness.cleanup());
  harness.mount(page);
  await harness.flush();
  const tree = () => harness.tree();
  const form = () => nodes(tree(), node => node.type === 'form')[0];
  const button = () => nodes(tree(), node => node.type === 'button')[0];
  const state = () => nodes(tree(), node => node.props?.['data-submit-state'])[0]?.props['data-submit-state'];
  const input = id => nodes(tree(), node => node.props?.id === id)[0];
  const change = async (id, value) => { input(id).props.onChange({ target: { id, value } }); await harness.flush(); };
  return { harness, pending, sent, notices, tree, form, button, state, input, change };
}

test('문의 전송은 실제 응답까지 pending이고 같은 프레임 중복 제출도 차단한다', async t => {
  const env = await setup(t);
  await env.change('name', '테스터');
  await env.change('email', 'local@example.test');
  await env.change('subject', '로컬 문의');
  await env.change('message', '테스트 메시지');
  const submit = env.form().props.onSubmit;
  const first = submit({ preventDefault() {} });
  const second = submit({ preventDefault() {} });
  await env.harness.flush();
  assert.equal(env.sent.length, 1);
  assert.equal(env.state(), 'pending');
  assert.equal(env.button().props.disabled, true);
  assert.equal(env.form().props['aria-busy'], true);
  assert.deepEqual(env.sent[0], { name: '테스터', email: 'local@example.test', subject: '로컬 문의', message: '테스트 메시지' });
  assert.equal(env.notices.length, 0);
  env.pending.resolve({ success: true, message: '완료' });
  await Promise.all([first, second]);
  await env.harness.flush();
  assert.equal(env.state(), 'success');
  assert.equal(env.input('message').props.value, '');
  assert.equal(env.button().props.disabled, false);
  assert.equal(nodes(env.tree(), node => node.type === 'svg' && node.props['data-submit-check'] !== undefined).length, 1);
  assert.deepEqual(env.notices, [['success', '완료']]);
  assert.equal(nodes(env.tree(), node => node.props?.['aria-live'] || node.props?.role === 'status').length, 0);
  await env.change('name', '새 문의');
  assert.equal(env.state(), 'idle');
});

for (const network of [false, true]) test(`문의 ${network ? '네트워크 오류' : '실패 응답'}는 입력을 보존하고 다음 입력에서 idle로 돌아간다`, async t => {
  const env = await setup(t);
  await env.change('message', '실패해도 보존');
  const submitted = env.form().props.onSubmit({ preventDefault() {} });
  if (network) env.pending.reject(new Error('local fixture'));
  else env.pending.resolve({ success: false, message: '다시 시도' });
  await submitted;
  await env.harness.flush();
  assert.equal(env.state(), 'error');
  assert.equal(env.input('message').props.value, '실패해도 보존');
  assert.equal(env.notices[0][0], 'error');
  assert.equal(env.notices.length, 1);
  assert.equal(env.button().props.disabled, false);
  await env.change('message', '다음 입력');
  assert.equal(env.state(), 'idle');
});

test('문의 필수 항목과 비활성 설정을 유지한다', async t => {
  const env = await setup(t);
  assert.equal(env.input('name').props.required, true);
  assert.equal(env.input('email').props.required, true);
  assert.equal(env.input('email').props.type, 'email');
  assert.equal(env.input('message').props.required, true);
  assert.equal(env.input('subject').props.required, undefined);
  const disabled = await setup(t, { enabled: false });
  assert.equal(disabled.form(), undefined);
  assert.match(textContent(disabled.tree()), /비활성화/);
  assert.equal(disabled.sent.length, 0);
});

test('문의 성공 응답은 전송 대기 중 작성한 다음 문의를 지우거나 전송 완료로 표시하지 않는다', async t => {
  const env = await setup(t);
  await env.change('name', '첫 문의자');
  await env.change('email', 'first@example.test');
  await env.change('message', '이미 전송한 내용');
  const submitted = env.form().props.onSubmit({ preventDefault() {} });
  await env.harness.flush();
  await env.change('message', '응답 대기 중 새로 작성한 내용');
  await env.change('subject', '다음 문의 제목');
  assert.equal(env.state(), 'pending');
  env.pending.resolve({ success: true, message: '완료' });
  await submitted;
  await env.harness.flush();
  assert.equal(env.input('message').props.value, '응답 대기 중 새로 작성한 내용');
  assert.equal(env.input('subject').props.value, '다음 문의 제목');
  assert.equal(env.input('name').props.value, '첫 문의자');
  assert.equal(env.state(), 'idle');
  assert.equal(env.button().props.disabled, false);
  assert.deepEqual(env.sent[0], { name: '첫 문의자', email: 'first@example.test', subject: '', message: '이미 전송한 내용' });
  await env.form().props.onSubmit({ preventDefault() {} });
  await env.harness.flush();
  assert.deepEqual(env.sent[1], { name: '첫 문의자', email: 'first@example.test', subject: '다음 문의 제목', message: '응답 대기 중 새로 작성한 내용' });
  assert.equal(env.input('message').props.value, '');
});