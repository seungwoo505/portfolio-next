// All content and credentials in this file are synthetic local verification data.
const http = require('node:http');
const { isLoopback } = require('./isolated-network');
const timestamp = '2026-10-27T00:00:00.000Z';
const credentials = { username: 'fixture-admin', password: 'fixture-only-password' };
const token = 'isolated-fixture-token';
const refreshToken = 'isolated-fixture-refresh-token';
const cover = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720"><rect width="1200" height="720" fill="#f4f4f5"/><rect x="120" y="120" width="960" height="480" rx="24" fill="#0f766e"/><text x="600" y="375" text-anchor="middle" fill="white" font-size="48">LOCAL FIXTURE / TEST DATA</text></svg>');

function createFixtureRouter() {
  let sequence = 100;
  const faults = new Map();
  const detailRequests = new Map();
  const dates = { created_at: timestamp, updated_at: timestamp };
  const tags = [
    { id: 'tag-1', name: 'TypeScript', slug: 'typescript', type: 'project', color: '#0f766e', usage_count: 8, ...dates },
    { id: 'tag-2', name: '로컬 검증', slug: 'local-test', type: 'general', color: '#52525b', usage_count: 6, ...dates },
    { id: 'tag-3', name: 'API 설계', slug: 'api-design', type: 'project', color: '#0f766e', usage_count: 6, ...dates },
    { id: 'tag-4', name: '접근성', slug: 'accessibility', type: 'general', color: '#52525b', usage_count: 6, ...dates },
    { id: 'tag-5', name: '문제 해결', slug: 'problem-solving', type: 'blog', color: '#0f766e', usage_count: 6, ...dates },
    { id: 'tag-6', name: '개발 기록', slug: 'development-notes', type: 'blog', color: '#52525b', usage_count: 6, ...dates },
  ];
  const profile = { id: 'fixture-profile', full_name: '[검증 데이터] 개발자', name: '[검증 데이터] 개발자', title: '로컬 화면 검증용 프로필', bio: '실제 경력과 무관한 명시적 로컬 검증 데이터입니다.', about: '이 소개는 레이아웃과 긴 한글 본문을 확인하는 테스트 데이터입니다.', email: 'fixture@example.invalid', location: '[검증] 서울', ...dates };
  const skills = [{ id: 'skill-1', name: 'TypeScript', proficiency_level: 80, category_id: 'category-1', category_name: '개발', display_order: 1, is_featured: true }];
  const categories = [{ id: 'category-1', name: '개발', display_order: 1, ...dates }];
  const settings = { site_title: '[검증 데이터] 포트폴리오', site_description: '실제 성과가 아닌 로컬 격리 검증 데이터', contact_email: 'fixture@example.invalid', contact_description: '이 폼은 로컬 메모리에만 저장됩니다.', contact_enabled: true, contact_form_success_message: '로컬 검증 메시지가 저장되었습니다.', enable_search: true, dark_mode: true };
  const content = '<h2>로컬 검증 데이터</h2><p>실제 프로젝트나 경력의 주장이 아닌 화면 검증 전용 본문입니다. 검색, 필터, 상세 및 관리자 저장을 확인합니다.</p><ul><li>외부 네트워크 요청 없음</li><li>메모리 안에서만 저장</li></ul>';
  const projects = Array.from({ length: 14 }, (_, index) => ({ id: `project-${index + 1}`, slug: `fixture-project-${index + 1}`, title: `[검증 데이터] 프로젝트 ${index + 1}`, description: `로컬 격리 환경의 프로젝트 ${index + 1} 설명입니다.`, content, content_html: content, content_text: '로컬 검증 프로젝트 본문', featured_image: cover, image_url: cover, status: 'completed', featured: index < 3, is_published: true, is_ongoing: false, view_count: 12 + index, display_order: index, start_date: '2026-01-01', end_date: '2026-02-01', technologies: 'TypeScript', tags: index % 2 ? [tags[0]] : tags, skills, ...dates }));
  const posts = Array.from({ length: 14 }, (_, index) => ({ id: `post-${index + 1}`, slug: `fixture-post-${index + 1}`, title: `[검증 데이터] 개발 기록 ${index + 1}`, excerpt: '로컬 검증을 위한 글 목록과 본문입니다.', content, content_html: content, content_text: '로컬 검증 개발 기록 본문', is_published: true, featured: index < 3, view_count: index + 5, read_time_minutes: 3, published_at: timestamp, tags: index % 2 ? [tags[0]] : tags, ...dates }));
  const collections = {
    tags, projects, 'blog/posts': posts, skills, 'skills/categories': categories,
    contacts: [{ id: 'contact-1', name: '[검증] 방문자', email: 'fixture@example.invalid', subject: '[검증] 문의', message: '명시적인 로컬 검증 메시지', status: 'unread', ...dates }],
    experiences: [{ id: 'experience-1', title: '[검증 데이터] 경험', company: '[검증] 가상 기관', company_or_institution: '[검증] 가상 기관', type: 'work', description: '실제 경력과 무관한 화면 검증 데이터', start_date: '2026-01-01', end_date: '2026-02-01', achievements: [], ...dates }],
    interests: [{ id: 'interest-1', title: '[검증 데이터] 기술 탐구', description: '로컬 검증 관심사', category: 'technical', display_order: 1, ...dates }],
    users: [{ id: 'user-1', username: credentials.username, email: 'fixture@example.invalid', role: 'super_admin', status: 'active', is_active: 1, ...dates }], logs: [],
  };
  const success = (data, extra = {}) => ({ status: 200, body: { success: true, data: structuredClone(data), ...extra } });
  const failure = (status, message) => ({ status, body: { success: false, message } });
  function list(items, params) {
    let found = [...items];
    const search = params.get('search')?.toLowerCase();
    if (search) found = found.filter((item) => `${item.title || item.name} ${item.description || item.excerpt || ''}`.toLowerCase().includes(search));
    if (params.get('featured') === 'true') found = found.filter((item) => item.featured);
    if (params.get('status') === 'published') found = found.filter((item) => item.is_published);
    if (params.get('status') === 'draft') found = found.filter((item) => !item.is_published);
    for (const field of ['tags', 'skills']) {
      const selected = params.get(field)?.split(',');
      if (selected) found = found.filter((item) => selected.every((value) => (item[field] || []).some((entry) => [entry.id, entry.slug, entry.name].includes(value))));
    }
    if (params.has('category')) found = found.filter((item) => item.category === params.get('category'));
    if (params.has('type')) found = found.filter((item) => item.type === params.get('type'));
    const sort = params.get('sort');
    if (sort) found.sort((a, b) => String(a[sort]).localeCompare(String(b[sort]), 'ko', { numeric: true }) * (params.get('order') === 'asc' ? 1 : -1));
    const limit = Math.max(1, Math.min(100, Number(params.get('limit')) || 50));
    const page = Math.max(1, Number(params.get('page')) || 1);
    return success(found.slice((page - 1) * limit, page * limit), { pagination: { page, limit, total: found.length, totalPages: Math.max(1, Math.ceil(found.length / limit)) } });
  }
  return async ({ method = 'GET', path, body = {}, authorization }) => {
    const url = new URL(path, 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname).replace(/\/$/, '');
    if (pathname === '/health') return success({ status: 'ok', fixture: true, timestamp });
    // Fault controls belong only to this synthetic, loopback-bound verification API.
    if (pathname === '/__fixture/faults') {
      if (authorization !== `Bearer ${token}`) return failure(401, '로컬 검증 토큰이 필요합니다.');
      if (method === 'GET') return success({ pending: [...faults].map(([path, fault]) => ({ path, ...fault })), requests: Object.fromEntries(detailRequests) });
      if (method === 'DELETE') { faults.clear(); return success({ cleared: true }); }
      if (method !== 'POST') return failure(405, '허용되지 않는 검증 작업');
      const remaining = body.remaining ?? 1;
      if (typeof body.path !== 'string' || !/^\/public\/(projects|posts)\/[^/?#]+$/.test(body.path) || ![200, 503].includes(body.status) || !Number.isInteger(remaining) || remaining < 1 || remaining > 10) return failure(400, '상세 경로와 명시적 검증 오류만 허용합니다.');
      faults.set(body.path, { status: body.status, remaining });
      return success({ path: body.path, status: body.status, remaining });
    }
    if (method === 'GET' && /^\/public\/(projects|posts)\/[^/]+$/.test(pathname)) {
      detailRequests.set(pathname, (detailRequests.get(pathname) || 0) + 1);
      const fault = faults.get(pathname);
      if (fault) {
        fault.remaining -= 1;
        if (!fault.remaining) faults.delete(pathname);
        return failure(fault.status, '[검증] 일시적인 로컬 상세 응답 오류입니다.');
      }
    }
    if (pathname === '/admin/login' && method === 'POST') {
      return body.username === credentials.username && body.password === credentials.password
        ? success({ user: collections.users[0], token, refreshToken, permissions: ['*', 'users.manage', 'settings.manage'] })
        : failure(401, '로컬 검증 계정이 일치하지 않습니다.');
    }
    if (pathname === '/admin/refresh' && method === 'POST') return body.refreshToken === refreshToken ? success({ token, refreshToken }) : failure(401, '검증 refresh token 오류');
    if (pathname.startsWith('/admin/') && authorization !== `Bearer ${token}`) return failure(401, '로컬 검증 로그인이 필요합니다.');
    if (pathname === '/admin/me') return success({ user: collections.users[0], permissions: ['*', 'users.manage', 'settings.manage'] });
    if (pathname === '/admin/logout') return success({ message: '로컬 로그아웃' });
    if (pathname === '/admin/password') return success({ message: '로컬 비밀번호 검증 완료' });
    if (pathname === '/admin/upload/image') return success({ url: cover });
    if (pathname === '/admin/dashboard') return success({ blog: { total: posts.length, published: posts.length, drafts: 0 }, projects: { total: projects.length, featured: 3 }, contacts: { total: collections.contacts.length, unread: collections.contacts.filter((item) => item.status === 'unread').length }, activities: { total: 0, today: 0 } });
    if (pathname === '/public/profile' || pathname === '/admin/personal-info') {
      if (method === 'PUT') Object.assign(profile, body);
      return success(profile);
    }
    if (pathname === '/public/settings') return success(settings);
    if (pathname === '/admin/settings') {
      if (method === 'PUT') {
        for (const [key, entry] of Object.entries(body.settings || {})) settings[key] = entry.value;
      }
      return success(Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, { value, type: typeof value, is_public: true, description: '로컬 검증 설정', updated_at: timestamp }])));
    }
    if (pathname === '/public/skills') return success({ skills, categories, skillsByCategory: categories.map((category) => ({ ...category, skills })) });
    if (pathname === '/public/skills/featured') return success(skills.filter((skill) => skill.is_featured));
    if (pathname === '/public/social-links') return success([]);
    if (pathname === '/public/contact' && method === 'POST') {
      const item = { ...body, id: `contact-${++sequence}`, status: 'unread', ...dates };
      collections.contacts.push(item);
      return success({ id: item.id }, { message: '로컬 검증 메시지가 저장되었습니다.' });
    }
    let resource = pathname.replace(/^\/(public|admin)\//, '');
    const isPublic = pathname.startsWith('/public/');
    if (isPublic && resource.startsWith('posts')) resource = resource.replace(/^posts/, 'blog/posts');
    resource = resource.replace(/^experiences\/timeline$/, 'experiences');
    const key = Object.keys(collections).sort((a, b) => b.length - a.length).find((name) => resource === name || resource.startsWith(`${name}/`));
    if (!key) return failure(404, `정의되지 않은 로컬 fixture 경로: ${pathname}`);
    const items = collections[key];
    const remainder = resource.slice(key.length).replace(/^\/slug\//, '/').replace(/^\//, '');
    if (!remainder) {
      if (method === 'GET') return list(items, url.searchParams);
      if (!isPublic && method === 'POST') {
        const item = { ...dates, ...body, id: `fixture-${++sequence}` };
        items.push(item);
        return success(item);
      }
    }
    const [id, action] = remainder.split('/');
    const index = items.findIndex((item) => item.id === id || item.slug === id);
    if (index === -1) return failure(404, '로컬 검증 데이터를 찾을 수 없습니다.');
    if (action === 'view' && method === 'POST') { items[index].view_count += 1; return success({ success: true }); }
    if (isPublic && method !== 'GET') return failure(405, '허용되지 않는 fixture 작업');
    if (method === 'DELETE') { items.splice(index, 1); return success({ message: '로컬 삭제 완료' }); }
    if (method === 'PUT' || method === 'PATCH') Object.assign(items[index], body, action === 'read' ? { status: 'read' } : {});
    return success(items[index]);
  };
}

function startFixtureApi({ port = 4319 } = {}) {
  const route = createFixtureRouter();
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && !isLoopback(new URL(origin).hostname)) { res.writeHead(403).end(); return; }
    res.setHeader('Access-Control-Allow-Origin', origin || 'http://127.0.0.1:4318');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control,Pragma,Expires,Last-Modified,X-Refresh-Token');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 8 * 1024 * 1024) { res.writeHead(413).end(); return; }
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks).toString();
      const body = req.headers['content-type']?.includes('application/json') && raw ? JSON.parse(raw) : {};
      const result = await route({ method: req.method, path: req.url, body, authorization: req.headers.authorization });
      res.writeHead(result.status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result.body));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ success: false, message: error.message }));
    }
  });
  server.listen(port, '127.0.0.1');
  return server;
}
if (require.main === module) {
  const server = startFixtureApi({ port: Number(process.env.ISOLATED_API_PORT) || 4319 });
  server.on('listening', () => console.log(`Local fixture API: http://127.0.0.1:${server.address().port} (test data only)`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
module.exports = { createFixtureRouter, startFixtureApi, credentials };
