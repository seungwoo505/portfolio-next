const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { loadWithMocks } = require('./helpers/react-harness.cjs');

const passthrough = () => null;
const { HomeFeaturedProjects, HomeLatestArticles } = loadWithMocks(
  path.resolve(__dirname, '../src/app/components/home/HomeLatestContent.tsx'),
  {
    'next/link': ({ children, href }) => React.createElement('a', { href }, children),
    'lucide-react': { ArrowRight: passthrough, ArrowUpRight: passthrough },
    '@/components/ProjectCoverImage': passthrough,
    '@/components/site/Container': { Container: ({ children }) => React.createElement('section', null, children) },
    './HomeStateViews': { EmptyState: passthrough, SkeletonCard: passthrough },
  },
);

function project(overrides = {}) {
  return { id: 'fixture-project', title: '로컬 검증 프로젝트', description: '검증용 데이터',
    slug: 'local-project', featured: true, created_at: '2026-01-01', ...overrides };
}

for (const viewCount of [38, 0]) {
  test(`홈 대표 프로젝트는 실제 조회수 ${viewCount}를 표시한다`, () => {
    const html = renderToStaticMarkup(React.createElement(HomeFeaturedProjects, {
      loading: false, projects: [project({ view_count: viewCount })],
    }));
    assert.match(html, new RegExp(`조회 ${viewCount}(?:<|$)`));
  });
  test(`홈 최신 글은 실제 조회수 ${viewCount}를 표시한다`, () => {
    const html = renderToStaticMarkup(React.createElement(HomeLatestArticles, {
      loading: false, posts: [{ id: 'fixture-post', title: '로컬 검증 기록', content: '',
        slug: 'local-post', created_at: '2026-01-01', view_count: viewCount }],
    }));
    assert.match(html, new RegExp(`조회 ${viewCount}(?:<|$)`));
  });
}

for (const field of ['skills', 'tags']) {
  for (const values of [['React', 'TypeScript'], [{ id: 'react', name: 'React' }, { id: 'typescript', name: 'TypeScript' }], ['React', { id: 'typescript', name: 'TypeScript' }]]) {
    test(`홈 프로젝트의 ${field} ${values.map(value => typeof value).join('/')} 목록을 이름으로 안전하게 렌더링한다`, () => {
      const html = renderToStaticMarkup(React.createElement(HomeFeaturedProjects, {
        loading: false, projects: [project({ [field]: values })],
      }));
      assert.match(html, />React</);
      assert.match(html, />TypeScript</);
      assert.doesNotMatch(html, /\[object Object\]/);
    });
  }
}
