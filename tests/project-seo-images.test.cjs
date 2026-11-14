const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadWithMocks, nodes } = require('./helpers/react-harness.cjs');

function routeFor(images) {
  return loadWithMocks(path.resolve(__dirname, '../src/app/(site)/projects/[slug]/page.tsx'), {
    '@/lib/server-fetch': { serverFetch: async () => ({ success: true, data: {
      id: 'local', slug: 'local', title: '로컬 프로젝트', description: '로컬 소개', tags: [],
      created_at: '2026-01-01', updated_at: '2026-01-01', start_date: '2026-01-01', ...images,
    } }) },
    './ProjectDetailClient': () => null,
  });
}

for (const { name, images, expected, structured = expected } of [
  {
    name: 'GitHub blob', images: { featured_image: ' https://github.com/owner/repo/blob/main/images/cover.png?raw=true#preview ' },
    expected: 'https://raw.githubusercontent.com/owner/repo/main/images/cover.png',
  },
  {
    name: 'raw query 제거', images: { image_url: 'https://raw.githubusercontent.com/owner/repo/main/cover.png?token=old#preview' },
    expected: 'https://raw.githubusercontent.com/owner/repo/main/cover.png',
  },
  { name: '루트 상대경로', images: { featured_image: '/images/cover.png' }, expected: 'https://seungwoo.i234.me/images/cover.png' },
  { name: '일반 상대경로', images: { featured_image: 'images/cover.png' }, expected: 'https://seungwoo.i234.me/images/cover.png' },
  { name: 'data URL', images: { featured_image: 'data:image/png;base64,AAAA' }, expected: 'https://seungwoo.i234.me/og-image.svg', structured: null },
  { name: '이미지 부재', images: {}, expected: 'https://seungwoo.i234.me/og-image.svg', structured: null },
]) {
  test(`프로젝트 ${name} 이미지를 OpenGraph/twitter/JSON-LD/screenshot에 일관되게 사용한다`, async () => {
    const route = routeFor(images);
    const params = { params: Promise.resolve({ slug: 'local' }) };
    const metadata = await route.generateMetadata(params);
    assert.equal(metadata.openGraph.images[0].url, expected);
    assert.equal(metadata.twitter.images[0], expected);
    const tree = await route.default(params);
    const script = nodes(tree, node => node.type === 'script')[0];
    const jsonLd = JSON.parse(script.props.dangerouslySetInnerHTML.__html);
    assert.equal(jsonLd.image?.url, structured === null ? undefined : structured);
    assert.equal(jsonLd.mainEntity.screenshot, structured === null ? undefined : structured);
  });
}
