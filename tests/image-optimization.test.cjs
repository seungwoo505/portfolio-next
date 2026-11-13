const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Image = require('next/image').default;
const { getImgProps } = require('next/dist/shared/lib/get-img-props');
const defaultLoader = require('next/dist/shared/lib/image-loader').default;
const { imageConfigDefault } = require('next/dist/shared/lib/image-config');
const { hasRemoteMatch } = require('next/dist/shared/lib/match-remote-pattern');
const { getImageRemotePatterns, shouldBypassImageOptimization } = require('../src/lib/image-policy.ts');
const { createHarness, loadWithMocks, nodes } = require('./helpers/react-harness.cjs');

function imageProps(input, config = require('../next.config.ts').default.images) {
  return getImgProps(input, {
    defaultLoader,
    imgConf: { ...imageConfigDefault, ...config },
  }).props;
}

async function projectImage(t, src) {
  const harness = createHarness();
  t.after(() => harness.cleanup());
  const component = loadWithMocks(path.resolve(__dirname, '../src/components/ProjectCoverImage.tsx'), {
    react: harness.react,
  }).default;
  harness.mount(component, { src, alt: '대표 이미지', sizes: '(min-width: 768px) 536px, 100vw', transitionKey: 'fixture' });
  await harness.flush();
  return { element: nodes(harness.tree(), node => node.type === Image)[0], tree: harness.tree(), harness };
}

test('신뢰 원격 프로젝트 커버는 기존 크롭과 전환 마커를 유지하며 반응형 이미지 후보를 제공한다', async t => {
  const src = 'https://raw.githubusercontent.com/owner/repo/main/cover.jpg';
  const { element, tree } = await projectImage(t, src);
  const props = imageProps(element.props);
  assert.match(props.src, /^\/_next\/image\?url=/);
  assert.match(props.srcSet, /w=640&q=75 640w/);
  assert.match(props.srcSet, /w=1200&q=75 1200w/);
  assert.equal(props.sizes, '(min-width: 768px) 536px, 100vw');
  assert.equal(props.className, 'object-cover');
  assert.equal(tree.props['data-project-image'], 'fixture');
  assert.equal(tree.props['data-project-image-role'], 'list');
});

test('등록되지 않은 원격 프로젝트 이미지는 Next host 오류 없이 원본 표시와 오류 대체 UI를 유지한다', async t => {
  const src = 'https://unknown.example/cover.jpg';
  const { element, harness } = await projectImage(t, src);
  let props;
  assert.doesNotThrow(() => { props = imageProps(element.props); });
  assert.equal(props.src, src);
  assert.equal(props.srcSet, undefined);
  element.props.onError();
  await harness.flush();
  assert.equal(nodes(harness.tree(), node => node.type === Image).length, 0);
});

test('로컬 프로젝트 JPEG도 반응형 최적화 API를 사용한다', async t => {
  const { element } = await projectImage(t, '/images/cover.jpg?revision=2');
  const props = imageProps(element.props);
  assert.match(props.src, /^\/_next\/image\?url=%2Fimages%2Fcover.jpg%3Frevision%3D2/);
  assert.ok(props.srcSet);
});

const productionEnvironment = { isolatedPreview: false };
const rasterSources = [
  '/images/cover.jpg',
  '/images/cover.PNG?revision=2',
  '/images/cover.webp',
  'https://raw.githubusercontent.com/owner/repo/main/cover.jpeg',
  'https://seungwoo.i234.me/images/cover.avif',
  'https://api.seungwoo.i234.me/uploads/cover.jpg?revision=2',
];

for (const src of rasterSources) {
  test(`래스터 이미지 최적화 허용은 실제 Next matcher 및 loader와 일치한다: ${src}`, () => {
    assert.equal(shouldBypassImageOptimization(src, productionEnvironment), false);
    const remotePatterns = getImageRemotePatterns(productionEnvironment);
    if (!src.startsWith('/')) assert.equal(hasRemoteMatch([], remotePatterns, new URL(src)), true);
    const props = imageProps({ src, alt: '이미지', width: 80, height: 80, unoptimized: false }, {
      ...require('../next.config.ts').default.images, remotePatterns,
    });
    assert.match(props.src, /^\/_next\/image\?url=/);
    assert.match(props.srcSet, / 1x, .* 2x$/);
  });
}

const directSources = [
  'https://unknown.example/cover.jpg',
  'https://raw.githubusercontent.com.evil.example/cover.jpg',
  'https://raw.githubusercontent.com:444/cover.jpg',
  'http://raw.githubusercontent.com/owner/cover.jpg',
  'https://raw.githubusercontent.com/owner/icon.svg',
  'https://raw.githubusercontent.com/owner/animation.GIF?revision=2',
  'https://raw.githubusercontent.com/owner/image?id=1',
  'https://user:password@raw.githubusercontent.com/owner/cover.jpg',
  '/images/icon.svg',
  '/images/animation.gif',
  '/_next/image/cover.jpg',
  '/%5Fnext/image/cover.jpg',
  '/images/%invalid/cover.jpg',
  '//unknown.example/cover.jpg',
  'images/cover.jpg',
  './images/cover.jpg',
  'data:image/png;base64,AAAA',
  'blob:http://127.0.0.1:4318/cover.jpg',
  'https://raw.githubusercontent.com/owner/cover.bmp',
];

for (const src of directSources) {
  test(`원본 표시가 필요한 소스는 Next host/URL 오류와 srcset 없이 유지된다: ${src}`, () => {
    const unoptimized = shouldBypassImageOptimization(src, productionEnvironment);
    assert.equal(unoptimized, true);
    let props;
    assert.doesNotThrow(() => { props = imageProps({ src, alt: '이미지', width: 80, height: 80, unoptimized }); });
    assert.equal(props.src, src);
    assert.equal(props.srcSet, undefined);
  });
}

test('명시한 공개 API origin만 추가하고 유사 host와 다른 port는 원본을 유지한다', () => {
  const environment = { apiUrl: 'https://images.example:8443/api', isolatedPreview: false };
  const patterns = getImageRemotePatterns(environment);
  for (const [src, bypass] of [
    ['https://images.example:8443/uploads/photo.jpg', false],
    ['https://images.example/uploads/photo.jpg', true],
    ['https://images.example.evil.example:8443/photo.jpg', true],
  ]) {
    assert.equal(shouldBypassImageOptimization(src, environment), bypass);
    assert.equal(hasRemoteMatch([], patterns, new URL(src)), !bypass);
  }
});

test('환경 API URL은 wildcard host와 credentials를 허용 패턴에 추가하지 않는다', () => {
  for (const apiUrl of ['https://*.example', 'https://user:password@images.example', 'not-a-url', 'data:image/png;base64,AAAA']) {
    const patterns = getImageRemotePatterns({ apiUrl, isolatedPreview: false });
    assert.equal(patterns.length, 3);
    assert.equal(patterns.some(pattern => pattern.hostname.includes('*')), false);
  }
});

test('루프백 fixture origin은 격리 모드에서만 정확한 port로 최적화한다', () => {
  const src = 'http://127.0.0.1:4319/__fixture/images/cover.jpg';
  for (const isolatedPreview of [false, true]) {
    const environment = { apiUrl: 'http://127.0.0.1:4319', isolatedPreview };
    const remotePatterns = getImageRemotePatterns(environment);
    assert.equal(shouldBypassImageOptimization(src, environment), !isolatedPreview);
    assert.equal(hasRemoteMatch([], remotePatterns, new URL(src)), isolatedPreview);
    assert.equal(shouldBypassImageOptimization('http://127.0.0.1:4320/cover.jpg', environment), true);
    assert.equal(shouldBypassImageOptimization('http://localhost:4319/cover.jpg', environment), true);
    const props = imageProps({ src, alt: 'fixture', width: 536, height: 302, unoptimized: !isolatedPreview }, {
      ...require('../next.config.ts').default.images, remotePatterns,
    });
    if (isolatedPreview) assert.match(props.src, /^\/_next\/image\?url=http%3A%2F%2F127.0.0.1%3A4319/);
    else assert.equal(props.src, src);
  }
});

test('Next config는 정상 배포의 로컬 IP 보호를 유지하고 격리 모드에만 이를 허용한다', () => {
  const variables = ['NEXT_PUBLIC_ISOLATED_PREVIEW', 'NEXT_PUBLIC_API_URL'];
  const previous = Object.fromEntries(variables.map(key => [key, process.env[key]]));
  try {
    for (const [flag, expected] of [['0', false], ['1', true]]) {
      process.env.NEXT_PUBLIC_ISOLATED_PREVIEW = flag;
      process.env.NEXT_PUBLIC_API_URL = 'http://127.0.0.1:4319';
      const filename = require.resolve('../next.config.ts');
      delete require.cache[filename];
      const config = require(filename).default.images;
      assert.equal(config.dangerouslyAllowLocalIP, expected);
      assert.equal(hasRemoteMatch([], config.remotePatterns, new URL('http://127.0.0.1:4319/__fixture/images/cover.jpg')), expected);
      assert.equal(config.dangerouslyAllowSVG, false);
    }
  } finally {
    for (const key of variables) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
    delete require.cache[require.resolve('../next.config.ts')];
  }
});

for (const [name, file, input] of [
  ['LazyImage', 'LazyImage.tsx', { priority: true, width: 80, height: 80 }],
  ['OptimizedImage', 'OptimizedImage.tsx', { width: 80, height: 80 }],
]) test(`${name}는 등록되지 않은 URL도 Next 오류 없이 표시한다`, async t => {
  const harness = createHarness();
  t.after(() => harness.cleanup());
  const component = loadWithMocks(path.resolve(__dirname, '../src/components', file), { react: harness.react }).default;
  harness.mount(component, { ...input, src: 'https://unknown.example/cover.jpg', alt: '이미지' });
  await harness.flush();
  const element = nodes(harness.tree(), node => node.type === Image)[0];
  const props = imageProps(element.props);
  assert.equal(props.src, 'https://unknown.example/cover.jpg');
  assert.equal(props.srcSet, undefined);
});

for (const section of ['about', 'blog-detail', 'admin-blog']) {
  test(`${section}의 모든 Next 이미지는 미등록 원격 URL을 원본으로 표시한다`, async t => {
    const harness = createHarness();
    t.after(() => harness.cleanup());
    const src = 'https://unknown.example/cover.jpg';
    const post = {
      id: 'fixture', slug: 'fixture', title: '포스트', content: '', featured_image: src,
      excerpt: '', tags: [], is_published: true, created_at: '2026-01-01', updated_at: '2026-01-01', view_count: 1,
    };
    const noop = () => null;
    const mocks = {
      react: harness.react, 'next/link': noop,
      'next/navigation': { useRouter: () => ({ push() {} }) },
      'react-hot-toast': { error() {}, success() {} },
      '@/components/ScrollProgress': noop,
      '@/contexts/AdminContext': { useAdmin: () => ({ isAuthenticated: true, isLoading: false }) },
      '@/lib/api': {
        api: { get: async () => ({ success: true, data: [] }) },
        personalApi: {
          getPersonalInfo: async () => ({ success: true, data: { full_name: '프로필', avatar_url: src } }),
          getExperiencesTimeline: async () => ({ success: true, data: [] }),
        },
        blogApi: { incrementViewCount: async () => ({ success: true }) },
        authApi: { get: async () => ({ success: true, data: [post] }) },
      },
    };
    const file = section === 'about' ? 'app/(site)/about/page.tsx'
      : section === 'blog-detail' ? 'app/(site)/blog/[slug]/BlogPostClient.tsx' : 'app/admin/blog/page.tsx';
    const component = loadWithMocks(path.resolve(__dirname, '../src', file), mocks).default;
    if (section === 'blog-detail') {
      const inner = component({ slug: 'fixture', initialPost: post });
      harness.mount(inner.type, inner.props);
    } else harness.mount(component);
    await harness.flush();
    const images = nodes(harness.tree(), node => node.type === Image);
    assert.equal(images.length, section === 'admin-blog' ? 2 : 1);
    for (const image of images) {
      const props = imageProps(image.props);
      assert.equal(props.src, src);
      assert.equal(props.srcSet, undefined);
    }
  });
}
