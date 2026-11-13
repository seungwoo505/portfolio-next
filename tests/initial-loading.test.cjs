const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createHarness, loadWithMocks, nodes } = require('./helpers/react-harness.cjs');
const source = name => path.resolve(__dirname, '../src', name);
const nullView = () => null;
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }

function home() {
  return loadWithMocks(source('app/components/ClientHome.tsx'), {
    '@/lib/api': {}, 'lucide-react': { ArrowUpRight: nullView }, 'next/link': ({ children, href, className }) => React.createElement('a', { href, className }, children),
    '@/components/ScrollProgress': nullView,
    '@/components/site/Container': { Container: ({ children }) => React.createElement('section', null, children) },
    './home/HomeHeroSection': () => React.createElement('h1', null, '서버에서 준비한 첫 화면'),
    './home/HomeLatestContent': { HomeFeaturedProjects: nullView, HomeLatestArticles: nullView },
    './home/HomeSkillsSection': nullView,
    './home/HomeStateViews': { HomeLoadingState: () => React.createElement('p', { role: 'status' }, '로딩 중'), HomeErrorState: () => React.createElement('p', { role: 'alert' }, '조회 실패') },
  }).default;
}
for (const field of ['blogPosts', 'projects', 'skills']) test(`홈은 서버 ${field} 데이터가 있으면 효과 실행 전 본문을 렌더링한다`, () => {
  const props = { blogPosts: [], projects: [], skills: [], [field]: [{ id: 'local', featured: true }], personalInfo: { full_name: '로컬' } };
  const html = renderToStaticMarkup(React.createElement(home(), props));
  assert.match(html, /<h1>서버에서 준비한 첫 화면<\/h1>/);
  assert.doesNotMatch(html, /role="status"/);
});
test('홈은 초기 데이터가 없을 때 기존 로딩 화면과 오류 우선순위를 유지한다', () => {
  assert.match(renderToStaticMarkup(React.createElement(home(), {})), /role="status"/);
  assert.match(renderToStaticMarkup(React.createElement(home(), { error: '실패' })), /role="alert"/);
});

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
