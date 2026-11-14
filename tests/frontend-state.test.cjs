const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
require('@headlessui/react');
const { createHarness, loadWithMocks, nodes, textContent } = require('./helpers/react-harness.cjs');

const source = name => path.resolve(__dirname, '../src', name);
const toast = Object.assign(() => {}, { success() {}, error() {} });
const passthrough = () => null;
function setup(t, extra = {}) {
  const harness = createHarness();
  const previous = { document: global.document, window: global.window, MutationObserver: global.MutationObserver };
  const intervals = [];
  global.document = { documentElement: { classList: { contains: () => false } }, body: { style: {} }, addEventListener() {}, removeEventListener() {} };
  global.MutationObserver = class { observe() {} disconnect() {} };
  global.window = { setTimeout: () => 1, clearTimeout() {}, setInterval: fn => { intervals.push(fn); return intervals.length; }, clearInterval() {} };
  t.after(() => { harness.cleanup(); Object.assign(global, previous); });
  const mocks = {
    react: harness.react,
    'react-hot-toast': toast,
    'next/link': passthrough,
    'next/navigation': { useRouter: () => ({ push() {} }), useSearchParams: () => ({ get: () => 'fixture' }) },
    'lucide-react': { ArrowLeft: passthrough },
    '@/components/ScrollProgress': passthrough,
    '@/components/ProjectCoverImage': passthrough,
    '@/components/Pagination': passthrough,
    '@/contexts/AdminContext': { useAdmin: () => ({ isAuthenticated: true }) },
    ...extra,
  };
  return { harness, mocks, intervals };
}

const project = overrides => ({
  id: 'project-1', title: '프로젝트', slug: 'fixture', description: '소개',
  status: 'completed', featured: false, is_published: false, is_ongoing: true,
  start_date: '2026-01-01', end_date: '2026-09-01', tags: [],
  created_at: '2026-01-01', updated_at: '2026-01-01', view_count: 0, display_order: 0,
  ...overrides,
});

for (const flags of [
  { is_published: false, is_ongoing: true, expected: [false, true] },
  { is_published: true, is_ongoing: false, expected: [true, false] },
  { is_published: 0, is_ongoing: 1, expected: [false, true] },
  { is_published: '1', is_ongoing: 'true', expected: [true, true] },
  { is_published: 'false', is_ongoing: '0', expected: [false, false] },
]) test(`프로젝트 편집 저장은 status와 독립적인 ${JSON.stringify(flags)} 값을 보존한다`, async t => {
  let saved;
  const { harness, mocks } = setup(t, {
    '@/lib/api': { authApi: { get: async () => ({ success: true, data: project(flags) }), put: async (_url, data) => { saved = data; return { success: true }; } } },
    '../components/ProjectAdminForm': passthrough,
    '../components/projectFormUtils': { fetchProjectTagOptions: async () => [] },
  });
  const page = loadWithMocks(source('app/admin/projects/edit/page.tsx'), mocks).default;
  const inner = nodes(page(), node => node.type?.name === 'EditProjectContent')[0];
  harness.mount(inner.type);
  await harness.flush();
  const form = harness.tree();
  await form.props.onSubmit();
  assert.deepEqual([saved.is_published, saved.is_ongoing], flags.expected);
});

test('진행중이 아닌 상세는 과거 in_progress status의 진행중 배지를 표시하지 않는다', async t => {
  const { harness, mocks } = setup(t, { '@/lib/api': { projectApi: { incrementViewCount: async () => {} } } });
  const page = loadWithMocks(source('app/(site)/projects/[slug]/ProjectDetailClient.tsx'), mocks).default;
  const inner = page({ slug: 'fixture', initialProject: project({ status: 'in_progress', is_ongoing: false }) });
  harness.mount(inner.type, inner.props);
  await harness.flush();
  assert.doesNotMatch(textContent(harness.tree()), /진행 중/);
  assert.match(textContent(harness.tree()), /2026년 9월/);
});

test('프로젝트 상세는 completed 기본 status보다 진행중 boolean을 우선 표시한다', async t => {
  const { harness, mocks } = setup(t, { '@/lib/api': { projectApi: { incrementViewCount: async () => {} } } });
  const page = loadWithMocks(source('app/(site)/projects/[slug]/ProjectDetailClient.tsx'), mocks).default;
  const inner = page({ slug: 'fixture', initialProject: project({}) });
  harness.mount(inner.type, inner.props);
  await harness.flush();
  const displayed = textContent(harness.tree());
  assert.match(displayed, /진행 중/);
  assert.doesNotMatch(displayed, /완료된 프로젝트|2026년 9월/);
});

for (const skills of [['React'], [{ id: 'react', name: 'React' }]]) {
  test(`프로젝트 카드는 ${typeof skills[0]} 기술 목록의 이름을 표시한다`, async t => {
    const { harness, mocks } = setup(t, { '@/lib/api': {
      projectApi: { getAllProjects: async () => ({ success: true, data: [project({ skills })] }) },
      api: { get: async () => ({ success: true, data: [] }) },
    } });
    harness.mount(loadWithMocks(source('app/(site)/projects/page.tsx'), mocks).default);
    await harness.flush();
    const card = nodes(harness.tree(), node => node.type === 'article')[0];
    assert.match(textContent(card), /React/);
  });
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

for (const succeeds of [true, false]) {
  test(`설정 저장 ${succeeds ? '성공' : '실패'} 중 새 입력과 변경 표시는 다음 저장까지 유지된다`, async t => {
    const pending = deferred();
    const requests = [];
    const { harness, mocks } = setup(t, { '@/lib/api': { authApi: {
      get: async () => ({ success: true, data: {} }),
      put: async (_url, body) => { requests.push(body); return requests.length === 1 ? pending.promise : { success: true }; },
    } } });
    harness.mount(loadWithMocks(source('app/admin/settings/page.tsx'), mocks).default);
    await harness.flush();
    const input = index => nodes(harness.tree(), node => node.type === 'input' && node.props.type === 'text')[index];
    input(0).props.onChange({ target: { value: '저장할 제목' } });
    input(2).props.onChange({ target: { value: '저장할 로고' } });
    await harness.flush();
    nodes(harness.tree(), node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} });
    await harness.flush();
    assert.equal(requests[0].settings.site_title.value, '저장할 제목');
    input(0).props.onChange({ target: { value: '새 제목' } });
    input(1).props.onChange({ target: { value: '새 설명' } });
    await harness.flush();
    if (succeeds) pending.resolve({ success: true }); else pending.reject(new Error('저장 실패'));
    await harness.flush();
    assert.equal(input(0).props.value, '새 제목');
    assert.equal(nodes(harness.tree(), node => node.type === 'button' && node.props.type === 'submit')[0].props.disabled, false);
    nodes(harness.tree(), node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} });
    await harness.flush();
    assert.equal(requests[1].settings.site_title.value, '새 제목');
    assert.equal(requests[1].settings.site_description.value, '새 설명');
    assert.equal(Object.hasOwn(requests[1].settings, 'site_logo'), !succeeds);
  });
}

test('숙련도 0은 슬라이더와 저장 payload에서 0으로 유지된다', async t => {
  let saved;
  const { harness, mocks } = setup(t);
  harness.mount(loadWithMocks(source('app/admin/skills/components/SkillModal.tsx'), mocks).default, {
    isOpen: true, onClose() {}, categories: [{ id: 'frontend', name: '프론트엔드' }],
    skill: { id: 'skill', name: 'React', category_id: 'frontend', proficiency_level: 0, display_order: 0, is_featured: false },
    onSave: async data => { saved = data; return { success: true }; },
  });
  await harness.flush();
  const slider = nodes(harness.tree(), node => node.props?.id === 'skill-proficiency')[0];
  assert.deepEqual([Number(slider.props.min), slider.props.value], [0, 0]);
  assert.match(slider.props.style.background, /#3B82F6 0%/);
  await nodes(harness.tree(), node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} });
  assert.equal(saved.proficiency_level, 0);
});

test('숙련도 0의 제출 payload는 기본값 50으로 대체되지 않는다', async t => {
  let saved;
  const { harness, mocks } = setup(t);
  harness.mount(loadWithMocks(source('app/admin/skills/components/SkillModal.tsx'), mocks).default, {
    isOpen: true, onClose() {}, categories: [],
    skill: { name: 'React', proficiency_level: 0, is_featured: false },
    onSave: async data => { saved = data; return { success: true }; },
  });
  await harness.flush();
  await nodes(harness.tree(), node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} });
  assert.equal(saved.proficiency_level, 0);
});
