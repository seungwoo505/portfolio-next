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

async function blog(t) {
  const harness = createHarness(), posts = deferred(), tags = deferred();
  const Page = loadWithMocks(source('app/(site)/blog/page.tsx'), {
    react: harness.react, 'next/link': 'a', 'react-hot-toast': () => {},
    '@/components/ScrollProgress': nullView, '@/components/site/AnimatedList': { AnimatedList: 'div' }, '@/components/Pagination': nullView,
    '@/lib/api': { api: { get: async () => ({ success: true, data: {} }) }, blogApi: { getAllPosts: () => posts.promise, getTags: () => tags.promise } },
  }).default;
  harness.mount(Page); await harness.flush(); t.after(() => harness.cleanup());
  return { harness, posts, tags, cards: () => nodes(harness.tree(), node => node.type === 'article'), busy: () => nodes(harness.tree(), node => node.props?.['aria-label'] === '블로그 목록')[0].props['aria-busy'] };
}
const post = { id: 'local', title: '로컬 글', slug: 'local', content: '본문', excerpt: '요약', created_at: '2026-01-01', view_count: 0, tags: ['한글 태그'] };
const tag = { id: 'tag', name: '한글 태그', slug: 'hangul', type: 'blog' };
for (const tagsFirst of [false, true]) test(`블로그는 태그 ${tagsFirst ? '선행' : '후행'} 응답에서도 글을 표시하고 기존 slug 필터를 보존한다`, async t => {
  const env = await blog(t);
  if (tagsFirst) { env.tags.resolve({ success: true, data: [tag] }); await env.harness.flush(); }
  env.posts.resolve({ success: true, data: [post] }); await env.harness.flush();
  assert.equal(env.cards().length, 1); assert.equal(env.busy(), false);
  if (!tagsFirst) { env.tags.resolve({ success: true, data: [tag] }); await env.harness.flush(); }
  const filter = nodes(env.harness.tree(), node => node.type === 'button' && node.props['aria-pressed'] === false && JSON.stringify(node.props.children).includes('한글 태그'))[0];
  assert.ok(filter, '태그 필터가 표시되어야 한다');
  filter.props.onClick(); await env.harness.flush();
  assert.equal(env.cards().length, 1, '문자열 태그를 실제 slug로 매핑해야 한다');
});
test('블로그 태그 실패는 성공한 글과 검색을 숨기지 않는다', async t => {
  const env = await blog(t);
  env.posts.resolve({ success: true, data: [post] }); await env.harness.flush();
  assert.equal(env.cards().length, 1);
  env.tags.reject(new Error('격리 태그 실패')); await env.harness.flush();
  assert.equal(env.cards().length, 1);
  assert.equal(nodes(env.harness.tree(), node => node.props?.role === 'alert').length, 0);
  const input = nodes(env.harness.tree(), node => node.props?.['aria-label'] === '블로그 포스트 검색')[0];
  input.props.onChange({ target: { value: 'ㄹㅋ' } }); await env.harness.flush();
  assert.equal(env.cards().length, 1);
});
test('블로그 글 실패는 태그가 대기 중이어도 즉시 오류를 표시한다', async t => {
  const env = await blog(t); env.posts.reject(new Error('격리 글 실패')); await env.harness.flush();
  assert.equal(env.busy(), false);
  assert.equal(nodes(env.harness.tree(), node => node.props?.role === 'alert').length, 1);
  env.tags.resolve({ success: true, data: [tag] }); await env.harness.flush();
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
