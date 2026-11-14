const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createHarness, loadWithMocks, nodes } = require('./helpers/react-harness.cjs');

const source = name => path.resolve(__dirname, '../src', name);
const empty = () => null;
const large = '홈에서 전달하면 안 되는 상세 본문 '.repeat(8_000);
const expectedExcerpt = '  앞 &amp; 뒤' + '가'.repeat(129);
const serialized = value => JSON.parse(JSON.stringify(value));
const bytes = value => Buffer.byteLength(JSON.stringify(value), 'utf8');

function fixture() {
  return {
    blogPosts: [
      { id: 'post-excerpt', title: '기존 요약 우선', slug: '기존 요약/글', created_at: '2026-01-02T12:30:00Z',
        excerpt: '기존 <b>요약</b>', view_count: 0, content: large, content_json: { blocks: [{ text: large }] },
        content_html: large, content_text: large, tags: [{ name: '미표시 태그', description: large }],
        meta_description: large, updated_at: '2026-11-01', is_published: true, featured: true },
      { id: 'post-content', title: '본문으로 요약', slug: 'body-fallback', created_at: '2026-02-03T00:00:00Z',
        excerpt: '', view_count: 18, content: `<p>  앞 &amp; 뒤<b>${'가'.repeat(200)}</b></p>${large}`,
        content_json: { blocks: [{ text: large }] }, content_html: large, content_text: large,
        updated_at: '2026-11-01', is_published: true },
    ],
    projects: [
      { id: 27, title: '대표 작업', slug: '한글 작업/상세', description: '설명 유지', excerpt: '요약 유지',
        detailed_description: large, long_description: large, meta_description: large, content: large,
        content_json: { blocks: [{ text: large }] }, content_html: large, content_text: large,
        featured: false, is_featured: 1, featured_image: '/fixture/featured.svg', image_url: '',
        created_at: '2026-01-01', view_count: 0,
        tags: ['태그 문자열', { name: '태그 객체', description: large }],
        skills: [{ name: 'React', description: large }, 'TypeScript'] },
      { id: 'hidden', title: '미대표 작업', slug: 'hidden', description: '필터 유지', featured: false,
        image_url: '/fixture/primary.svg', featured_image: '/fixture/secondary.svg', created_at: '2026-01-01',
        view_count: 7, tags: [{ name: '태그 대체', description: large }], skills: [] },
    ],
    skills: [{ id: 'react', name: 'React', category_name: '프론트엔드', proficiency_level: 90,
      years_of_experience: 5, icon: large, color: '#fff', extra: { content: large } }],
    personalInfo: { full_name: '', name: '표시 이름', bio: '', about: '표시 소개', email: 'local@example.invalid',
      phone: '미표시', avatar_url: large, extra: { content: large } },
  };
}

async function serverProps(data, overrides = {}) {
  const responses = {
    '/public/posts': data.blogPosts, '/public/projects': data.projects,
    '/public/skills/featured': data.skills, '/public/profile': data.personalInfo,
  };
  const requests = [];
  const ClientHome = () => null;
  const Home = loadWithMocks(source('app/(site)/page.tsx'), {
    '../components/ClientHome': ClientHome,
    '@/lib/server-fetch': { serverFetch: async (url, options) => {
      requests.push({ url, options });
      if (overrides[url] instanceof Error) throw overrides[url];
      return Object.hasOwn(overrides, url) ? overrides[url] : { success: true, data: responses[url] };
    } },
  }).default;
  const tree = await Home();
  return { props: nodes(tree, node => node.type === ClientHome)[0].props, requests };
}

const expectedPosts = [
  { id: 'post-excerpt', title: '기존 요약 우선', slug: '기존 요약/글', created_at: '2026-01-02T12:30:00Z', excerpt: '기존 <b>요약</b>', view_count: 0 },
  { id: 'post-content', title: '본문으로 요약', slug: 'body-fallback', created_at: '2026-02-03T00:00:00Z', excerpt: expectedExcerpt, view_count: 18 },
];
const expectedProjects = [
  { id: '27', title: '대표 작업', slug: '한글 작업/상세', description: '설명 유지', excerpt: '요약 유지',
    featured: true, image_url: '/fixture/featured.svg', view_count: 0,
    tags: ['태그 문자열', '태그 객체'], skills: ['React', 'TypeScript'] },
  { id: 'hidden', title: '미대표 작업', slug: 'hidden', description: '필터 유지', featured: false,
    image_url: '/fixture/primary.svg', view_count: 7, tags: ['태그 대체'], skills: [] },
];

function assertLeanPayload(payload) {
  const forbidden = new Set(['content', 'content_json', 'content_html', 'content_text', 'detailed_description',
    'long_description', 'meta_description', 'meta_keywords', 'proficiency_level', 'email', 'phone', 'extra']);
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      assert.equal(forbidden.has(key), false, `홈 전달 데이터에 ${key}가 포함되면 안 됩니다`);
      visit(child);
    }
  };
  visit(payload);
}

test('실제 홈 서버 props는 표시용 필드만 전달하고 상세 본문과 중첩 메타데이터를 제외한다', async t => {
  const input = fixture();
  const { props, requests } = await serverProps(input);
  const inputBytes = bytes(input), propsBytes = bytes(props);
  t.diagnostic(`격리 fixture JSON: 원본 ${inputBytes} bytes → 홈 props ${propsBytes} bytes`);
  assertLeanPayload(props);
  assert.deepEqual(serialized(props.blogPosts), expectedPosts);
  assert.deepEqual(serialized(props.projects), expectedProjects);
  assert.deepEqual(serialized(props.skills), [{ id: 'react', name: 'React', category_name: '프론트엔드' }]);
  assert.deepEqual(serialized(props.personalInfo), { full_name: '', name: '표시 이름', bio: '', about: '표시 소개' });
  assert.equal(props.loading, false);
  assert.deepEqual(requests, [
    { url: '/public/posts', options: { searchParams: { limit: 2, featured: true } } },
    { url: '/public/projects', options: { searchParams: { limit: 2, featured: true } } },
    { url: '/public/skills/featured', options: undefined }, { url: '/public/profile', options: undefined },
  ]);
  assert.ok(propsBytes < inputBytes / 20, '상세 본문이 큰 응답의 홈 전달 바이트가 95% 이상 줄어야 합니다');
});

const { HomeFeaturedProjects, HomeLatestArticles } = loadWithMocks(source('app/components/home/HomeLatestContent.tsx'), {
  'next/link': ({ children, href }) => React.createElement('a', { href }, children),
  'lucide-react': { ArrowRight: empty, ArrowUpRight: empty },
  '@/components/ProjectCoverImage': ({ src, alt }) => React.createElement('img', { src, alt }),
  '@/components/site/Container': { Container: ({ children }) => React.createElement('section', null, children) },
});

test('경량 홈 글은 기존 요약 우선순위와 HTML 제거 140자, 날짜, 인코딩된 링크, 조회수 0을 유지한다', async () => {
  const { props } = await serverProps(fixture());
  const html = renderToStaticMarkup(React.createElement(HomeLatestArticles, { loading: false, posts: props.blogPosts }));
  assert.match(html, /기존 &lt;b&gt;요약&lt;\/b&gt;/);
  assert.ok(html.includes(expectedExcerpt.replaceAll('&', '&amp;')), '본문 요약의 공백과 엔티티를 보존해야 합니다');
  assert.equal(expectedExcerpt.length, 140);
  assert.match(html, /dateTime="2026-01-02T12:30:00Z"/i);
  assert.match(html, /2026\. 1\. 2\./);
  assert.ok(html.includes(`/blog/${encodeURIComponent('기존 요약/글')}`));
  assert.match(html, /조회 0</);
  assert.match(html, /조회 18</);
});

test('서버 일부 조회 실패와 빈 데이터는 성공한 영역과 기존 빈 화면을 보존한다', async () => {
  const { props } = await serverProps(fixture(), {
    '/public/posts': new Error('격리 실패'), '/public/projects': { success: true, data: [] },
    '/public/profile': { success: false },
  });
  assert.deepEqual(props.blogPosts, []);
  assert.deepEqual(props.projects, []);
  assert.equal(props.skills[0].name, 'React');
  assert.equal(props.personalInfo, undefined);
  assert.match(renderToStaticMarkup(React.createElement(HomeLatestArticles, { loading: false, posts: props.blogPosts })), /다음 기록을 준비하고 있습니다/);
  assert.match(renderToStaticMarkup(React.createElement(HomeFeaturedProjects, { loading: false, projects: props.projects })), /프로젝트를 준비하고 있습니다/);
});

async function client(t, data, refreshData, initialProps) {
  const harness = createHarness();
  const listeners = {};
  let refresh;
  const previousDocument = Object.getOwnPropertyDescriptor(global, 'document');
  const previousWindow = Object.getOwnPropertyDescriptor(global, 'window');
  const events = { addEventListener: (name, callback) => { listeners[name] = callback; }, removeEventListener: name => { delete listeners[name]; } };
  Object.defineProperty(global, 'document', { configurable: true, value: { ...events, hidden: false } });
  Object.defineProperty(global, 'window', { configurable: true, value: events });
  t.mock.method(global, 'setTimeout', callback => { refresh = callback; return 1; });
  t.mock.method(global, 'clearTimeout', () => {});
  const calls = { posts: [], projects: [] };
  const Articles = () => null, Projects = () => null, Skills = () => null, Hero = () => null;
  const ClientHome = loadWithMocks(source('app/components/ClientHome.tsx'), {
    react: harness.react, 'next/link': 'a', 'lucide-react': { ArrowUpRight: empty },
    '@/components/ScrollProgress': empty,
    '@/components/site/Container': { Container: 'section' },
    './home/HomeHeroSection': Hero,
    './home/HomeLatestContent': { HomeFeaturedProjects: Projects, HomeLatestArticles: Articles },
    './home/HomeSkillsSection': Skills,
    '@/lib/api': {
      blogApi: { getPosts: async params => { calls.posts.push(params); return { success: true, data: calls.posts.length > 1 && refreshData ? refreshData.blogPosts : data.blogPosts }; } },
      projectApi: { getProjects: async params => { calls.projects.push(params); return { success: true, data: calls.projects.length > 1 && refreshData ? refreshData.projects : data.projects }; } },
      personalApi: { getFeaturedSkills: async () => ({ success: true, data: data.skills }), getPersonalInfo: async () => ({ success: true, data: data.personalInfo }) },
    },
  }).default;
  t.after(() => {
    harness.cleanup();
    if (previousDocument) Object.defineProperty(global, 'document', previousDocument); else delete global.document;
    if (previousWindow) Object.defineProperty(global, 'window', previousWindow); else delete global.window;
  });
  harness.mount(ClientHome, initialProps);
  await harness.flush();
  const propsOf = view => nodes(harness.tree(), node => node.type === view)[0].props;
  return {
    harness, calls,
    output: () => ({ blogPosts: propsOf(Articles).posts, projects: propsOf(Projects).projects, skills: propsOf(Skills).currentSkills, hero: propsOf(Hero) }),
    focus: async () => { listeners.focus(); await refresh(); await harness.flush(); },
  };
}

test('빈 서버 데이터의 대체 API 응답도 홈 DTO로 투영하고 이미지, 기술 태그, 대표 필터, 프로필 fallback을 유지한다', async t => {
  const env = await client(t, fixture());
  const output = env.output();
  assertLeanPayload(output);
  assert.deepEqual(serialized(output.blogPosts), expectedPosts);
  assert.deepEqual(serialized(output.projects), expectedProjects.slice(0, 1));
  assert.deepEqual(serialized(output.skills), [{ id: 'react', name: 'React', category_name: '프론트엔드' }]);
  assert.equal(output.hero.displayName, '표시 이름');
  assert.equal(output.hero.displayDescription, '표시 소개');
  assert.deepEqual(env.calls.posts, [{ limit: 2, featured: true }]);
  assert.deepEqual(env.calls.projects, [{ limit: 2, featured: true }]);
  const html = renderToStaticMarkup(React.createElement(HomeFeaturedProjects, { loading: false, projects: output.projects }));
  assert.match(html, /src="\/fixture\/featured.svg"/);
  assert.match(html, /요약 유지/);
  assert.match(html, />React</);
  assert.match(html, />TypeScript</);
  assert.match(html, /조회 0</);
  assert.ok(html.includes(`/projects/${encodeURIComponent('한글 작업/상세')}`));
  assert.doesNotMatch(html, /미대표 작업/);
});

for (const [label, id] of [['숫자', 27], ['문자열', '27']]) {
  for (const viewCount of [42, 0]) {
    test(`${label} 프로젝트 ID의 조회수 ${viewCount} 갱신 시 기존 경량 본문과 카드를 보존한다`, async t => {
      const initial = fixture();
      initial.projects[0].view_count = 17;
      const refreshed = fixture();
      refreshed.blogPosts[1] = { ...refreshed.blogPosts[1], title: '갱신 제목 미반영', content: '갱신 본문 미반영', view_count: 0 };
      refreshed.projects[0] = { ...refreshed.projects[0], id, title: '갱신 프로젝트 미반영', view_count: viewCount };
      const env = await client(t, initial, refreshed);
      await env.focus();
      const output = env.output();
      assertLeanPayload(output);
      assert.deepEqual(serialized(output.blogPosts), [expectedPosts[0], { ...expectedPosts[1], view_count: 0 }]);
      assert.deepEqual(serialized(output.projects), [{ ...expectedProjects[0], view_count: viewCount }]);
      assert.equal(env.calls.posts.length, 2);
      assert.equal(env.calls.projects.length, 2);
    });
  }
}

test('빈 서버 프로필은 기존 대체조회를 유지하고 표시 이름과 소개를 복구한다', async t => {
  const env = await client(t, fixture(), undefined, {
    blogPosts: expectedPosts, projects: expectedProjects, skills: [{ id: 'react', name: 'React' }], personalInfo: {},
  });
  const output = env.output();
  assert.equal(output.hero.displayName, '표시 이름');
  assert.equal(output.hero.displayDescription, '표시 소개');
  assert.equal(env.calls.posts.length, 0);
  assert.equal(env.calls.projects.length, 0);
});
