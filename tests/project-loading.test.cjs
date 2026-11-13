const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHarness, loadWithMocks, nodes } = require('./helpers/react-harness.cjs');
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
async function setup(t) {
  const harness = createHarness(), list = deferred(), settings = deferred(), requests = [];
  const Page = loadWithMocks(path.resolve(__dirname, '../src/app/(site)/projects/page.tsx'), {
    react: harness.react, 'next/link': 'a', 'react-hot-toast': Object.assign(() => {}, { error() {} }),
    '@/components/ScrollProgress': () => null, '@/components/ProjectCoverImage': () => null,
    '@/lib/api': { projectApi: { getAllProjects: () => { requests.push('projects'); return list.promise; } }, api: { get: endpoint => { requests.push(endpoint); return endpoint === '/settings' ? settings.promise : Promise.resolve({ success: true, data: [] }); } } },
  }).default;
  t.after(() => harness.cleanup());
  harness.mount(Page); await harness.flush();
  const region = () => nodes(harness.tree(), n => n.props?.['aria-label'] === '프로젝트 목록')[0];
  const cards = () => nodes(harness.tree(), n => n.type === 'article');
  return { harness, list, settings, requests, region, cards };
}
const projects = [{ id:'local',slug:'local',title:'로컬 프로젝트',description:'설정 대기와 독립적인 카드',created_at:'2026-01-01',updated_at:'2026-01-01',skills:[],tags:[],view_count:0 }];

test('프로젝트 목록과 설정은 함께 시작하고 설정 대기 중에도 목록을 표시한다', async t => {
  const env = await setup(t);
  assert.ok(env.requests.includes('/settings'), '설정은 목록 응답을 기다리지 않고 시작해야 한다');
  assert.equal(env.region().props['aria-busy'], true);
  env.list.resolve({ success: true, data: projects }); await env.harness.flush();
  assert.equal(env.region().props['aria-busy'], false);
  assert.equal(env.cards().length, 1);
  env.settings.resolve({ success: true, data: { personal_github_url: 'https://github.com/local-fixture' } }); await env.harness.flush();
  assert.equal(nodes(env.harness.tree(), n => n.type === 'a' && n.props.href === 'https://github.com/local-fixture').length, 1);
});

test('설정 실패는 정상 프로젝트 목록을 오류나 추가 로딩으로 바꾸지 않는다', async t => {
  const env = await setup(t);
  env.list.resolve({ success: true, data: projects }); await env.harness.flush();
  assert.equal(env.cards().length, 1);
  assert.equal(env.region().props['aria-busy'], false);
  env.settings.reject(new Error('로컬 설정 실패')); await env.harness.flush();
  assert.equal(env.cards().length, 1);
  assert.equal(nodes(env.harness.tree(), n => n.props?.role === 'alert').length, 0);
});

test('목록 실패는 설정 응답을 기다리지 않고 오류와 재시도 버튼을 표시한다', async t => {
  const env = await setup(t);
  env.list.reject(new Error('로컬 목록 실패')); await env.harness.flush();
  assert.equal(env.region().props['aria-busy'], false);
  assert.equal(nodes(env.harness.tree(), n => n.props?.role === 'alert').length, 1);
  env.settings.resolve({ success: true, data: {} }); await env.harness.flush();
});