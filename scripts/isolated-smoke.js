const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { assertLocalDestination } = require('./isolated-network');
const { credentials } = require('./isolated-api');
const bundledPlaywright = 'C:/Users/QT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const { chromium } = require(process.env.ISOLATED_PLAYWRIGHT_PATH || bundledPlaywright);
const baseUrl = process.env.ISOLATED_APP_URL || 'http://127.0.0.1:4318';
const apiUrl = process.env.ISOLATED_API_URL || 'http://127.0.0.1:4319';
assertLocalDestination(baseUrl);
assertLocalDestination(apiUrl);
const allowedOrigins = new Set([new URL(baseUrl).origin, new URL(apiUrl).origin]);
const output = path.resolve(__dirname, '../.verification/isolated-smoke');
fs.mkdirSync(output, { recursive: true });
const report = { startedAt: new Date().toISOString(), baseUrl, apiUrl, checks: [], blockedRequests: [], browserErrors: [], fixture: true };
let browser;

async function createContext({ mobile = false, theme = 'light' } = {}) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, deviceScaleFactor: 1, colorScheme: theme, reducedMotion: 'reduce', serviceWorkers: 'block' });
  await context.addInitScript((value) => {
    if (!['http:', 'https:'].includes(location.protocol)) return;
    try {
      if (!localStorage.getItem('theme')) localStorage.setItem('theme', value);
    } catch {
      // Browser-created blank or restricted frames may not expose storage.
    }
  }, theme);
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (['data:', 'blob:'].includes(url.protocol) || allowedOrigins.has(url.origin)) return route.continue();
    report.blockedRequests.push(url.toString());
    return route.abort('blockedbyclient');
  });
  if (context.routeWebSocket) await context.routeWebSocket('**/*', (socket) => {
    const url = new URL(socket.url());
    if (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) socket.connectToServer();
    else { report.blockedRequests.push(url.toString()); socket.close(); }
  });
  context.on('page', (page) => page.on('pageerror', (error) => report.browserErrors.push(error.message)));
  return context;
}
async function check(name, run) {
  try { await run(); report.checks.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); throw error; }
}
async function goto(page, pathname) {
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'networkidle', timeout: 60000 });
  assert.ok(response.ok(), `${pathname} HTTP ${response.status()}`);
  await page.locator('main').first().waitFor({ state: 'visible' });
  assert.ok((await page.locator('body').innerText()).trim().length > 50, `${pathname} blank page`);
}
async function noOverflow(page, name) {
  const size = await page.evaluate(() => ({ width: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  assert.ok(size.content <= size.width + 1, `${name}: horizontal overflow ${JSON.stringify(size)}`);
}

async function publicScreens() {
  const paths = ['/', '/projects', '/projects/fixture-project-1', '/blog', '/blog/fixture-post-1', '/about', '/contact', '/settings'];
  for (const mobile of [false, true]) for (const theme of ['light', 'dark']) {
    const context = await createContext({ mobile, theme });
    const page = await context.newPage();
    for (const pathname of paths) await check(`${mobile ? 'mobile' : 'desktop'} ${theme} ${pathname}`, async () => {
      await goto(page, pathname);
      await page.waitForFunction((value) => document.documentElement.classList.contains('dark') === (value === 'dark'), theme);
      await noOverflow(page, pathname);
      await page.screenshot({ path: path.join(output, `${mobile ? 'mobile' : 'desktop'}-${theme}-${pathname.replace(/\//g, '_') || 'home'}.png`), fullPage: true });
    });
    await context.close();
  }
}
async function publicInteractions() {
  const context = await createContext();
  const page = await context.newPage();
  await check('project search, multiple filters, sorting and pagination', async () => {
    await goto(page, '/projects');
    const list = page.getByRole('region', { name: '프로젝트 목록', exact: true });
    await list.getByRole('link').first().waitFor();
    await page.getByRole('searchbox', { name: '프로젝트 검색' }).fill('no-matching-fixture');
    await page.getByRole('heading', { name: '검색 결과가 없습니다.' }).waitFor();
    await page.getByRole('searchbox', { name: '프로젝트 검색' }).fill('');
    const filters = page.locator('[aria-label="기술 스택 필터"] button').filter({ hasNotText: '전체' });
    assert.ok(await filters.count() >= 2);
    await filters.nth(0).click(); await filters.nth(1).click();
    assert.equal(await page.locator('[aria-label="기술 스택 필터"] button[aria-pressed="true"]').count(), 2);
    await page.locator('[data-all-projects]').click();
    await page.getByRole('combobox', { name: '프로젝트 정렬 방식 선택' }).selectOption('title');
    await page.getByRole('button', { name: '다음', exact: true }).click();
    await page.getByRole('button', { name: '이전', exact: true }).click();
  });
  await check('blog search, multiple tags and sorting', async () => {
    await goto(page, '/blog');
    await page.getByRole('searchbox', { name: '블로그 포스트 검색' }).fill('no-matching-fixture');
    await page.getByRole('heading', { name: '검색 결과가 없습니다.' }).waitFor();
    await page.getByRole('searchbox', { name: '블로그 포스트 검색' }).fill('');
    const tags = page.locator('[data-blog-tag]');
    assert.ok(await tags.count() >= 2);
    await tags.nth(0).click(); await tags.nth(1).click();
    assert.equal(await page.locator('[data-blog-tag][aria-pressed="true"]').count(), 2);
    await page.locator('[data-all-posts]').click();
    await page.getByRole('combobox', { name: '블로그 정렬 방식 선택' }).selectOption('view_count');
  });
  await check('contact submits only to local fixture', async () => {
    await goto(page, '/contact');
    await page.locator('#name').fill('[검증] 브라우저 방문자');
    await page.locator('#email').fill('browser@example.invalid');
    await page.locator('#subject').fill('[검증] 로컬 문의');
    await page.locator('#message').fill('브라우저 자동 검증으로 전송한 로컬 메시지입니다.');
    const response = page.waitForResponse((res) => res.url().startsWith(`${apiUrl}/public/contact`) && res.request().method() === 'POST');
    await page.getByRole('button', { name: '메시지 전송', exact: true }).click();
    assert.equal((await (await response).json()).success, true);
    await page.waitForFunction(() => document.querySelector('#message').value === '');
  });
  await check('theme toggle persists across navigation', async () => {
    await goto(page, '/');
    const before = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    await page.getByRole('button', { name: /모드|테마/ }).filter({ visible: true }).first().click();
    await page.waitForFunction((previous) => document.documentElement.classList.contains('dark') !== previous, before);
    await goto(page, '/about');
    assert.notEqual(await page.evaluate(() => document.documentElement.classList.contains('dark')), before);
  });
  await check('failed project request displays recoverable error state', async () => {
    const pattern = `${apiUrl}/public/projects**`;
    await context.route(pattern, (route) => route.fulfill({ status: 503, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': new URL(baseUrl).origin }, body: JSON.stringify({ success: false, message: '로컬 fixture 실패 상태 검증' }) }));
    await goto(page, '/projects');
    await page.getByRole('button', { name: /다시/ }).waitFor();
    await context.unroute(pattern);
  });
  await check('project loading state remains visible while local response is pending', async () => {
    const pattern = `${apiUrl}/public/projects**`;
    let release;
    const waiting = new Promise((resolve) => { release = resolve; });
    await context.route(pattern, async (route) => { await waiting; await route.continue(); });
    try {
      await page.goto(`${baseUrl}/projects`, { waitUntil: 'domcontentloaded' });
      await page.locator('[aria-label="프로젝트 목록"][aria-busy="true"]').waitFor();
    } finally { release(); }
    await page.locator('[aria-label="프로젝트 목록"][aria-busy="false"]').waitFor();
    await context.unroute(pattern);
  });
  await check('disabled contact setting renders clear form state', async () => {
    const pattern = `${apiUrl}/public/settings**`;
    await context.route(pattern, (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': new URL(baseUrl).origin }, body: JSON.stringify({ success: true, data: { contact_enabled: false } }) }));
    await goto(page, '/contact');
    await page.getByRole('heading', { name: '연락처 폼이 비활성화되었습니다' }).waitFor();
    assert.equal(await page.locator('form').count(), 0);
    await context.unroute(pattern);
  });
  await context.close();
  const mobileContext = await createContext({ mobile: true });
  const mobilePage = await mobileContext.newPage();
  await check('mobile menu opens and navigates', async () => {
    await goto(mobilePage, '/');
    await mobilePage.getByRole('button', { name: '메뉴 열기', exact: true }).click();
    await mobilePage.getByRole('button', { name: '메뉴 닫기', exact: true }).waitFor();
    await mobilePage.getByRole('link', { name: '소개', exact: true }).filter({ visible: true }).last().click();
    await mobilePage.waitForURL(`${baseUrl}/about`);
    await noOverflow(mobilePage, 'mobile menu');
  });
  await mobileContext.close();
}
async function responsiveAdminScreens() {
  for (const options of [{ mobile: false, theme: 'dark' }, { mobile: true, theme: 'light' }, { mobile: true, theme: 'dark' }]) {
    const label = `admin ${options.mobile ? 'mobile' : 'desktop'} ${options.theme}`;
    const context = await createContext(options);
    const page = await context.newPage();
    await check(`${label} navigation, editors and logout`, async () => {
      await goto(page, '/admin-login');
      await page.locator('#username').fill(credentials.username);
      await page.locator('#password').fill(credentials.password);
      await page.locator('form button[type="submit"]').click();
      await page.waitForURL(`${baseUrl}/admin`);
      for (const pathname of ['/admin/projects', '/admin/settings', '/admin/blog/new', '/admin/projects/new']) {
        await goto(page, pathname);
        if (pathname.endsWith('/new')) await page.locator('.bn-editor').first().waitFor({ state: 'visible' });
        await noOverflow(page, `${label} ${pathname}`);
        await page.screenshot({ path: path.join(output, `${label.replace(/ /g, '-')}-${pathname.replace(/\//g, '_')}.png`), fullPage: true });
      }
      if (options.mobile) {
        const toggle = page.getByRole('button', { name: '관리자 메뉴 열기', exact: true });
        await toggle.click();
        await page.getByRole('navigation', { name: '관리자 메뉴', exact: true }).getByRole('link', { name: '대시보드', exact: true }).click();
        await page.waitForURL(`${baseUrl}/admin`);
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      }
      await page.getByRole('button', { name: '로그아웃', exact: true }).click();
      await page.waitForURL(`${baseUrl}/admin-login`);
    });
    await context.close();
  }
}

async function adminInteractions() {
  const context = await createContext();
  const page = await context.newPage();
  await check('admin authentication uses explicit fixture credentials', async () => {
    await goto(page, '/admin-login');
    await page.locator('#username').fill(credentials.username);
    await page.locator('#password').fill(credentials.password);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(`${baseUrl}/admin`, { timeout: 30000 });
  });
  for (const pathname of ['/admin', '/admin/projects', '/admin/blog', '/admin/tags', '/admin/skills', '/admin/personal-info', '/admin/experiences', '/admin/interests', '/admin/contacts', '/admin/users', '/admin/logs', '/admin/settings']) await check(`admin read ${pathname}`, async () => {
    await goto(page, pathname);
    assert.equal(new URL(page.url()).pathname, pathname);
    await noOverflow(page, pathname);
    await page.screenshot({ path: path.join(output, `${pathname.replace(/\//g, '_')}.png`), fullPage: true });
  });
  await check('admin tag create, cancel, edit and delete', async () => {
    await goto(page, '/admin/tags');
    await page.getByRole('button', { name: '새 태그', exact: true }).first().click();
    await page.locator('#tag-name').fill('브라우저 취소 검증');
    await page.getByRole('dialog').getByRole('button', { name: '취소', exact: true }).click();
    assert.equal(await page.getByRole('heading', { name: '브라우저 취소 검증', exact: true }).count(), 0);
    await page.getByRole('button', { name: '새 태그', exact: true }).first().click();
    await page.locator('#tag-name').fill('브라우저 생성 검증');
    await page.getByRole('dialog').getByRole('button', { name: '생성', exact: true }).click();
    await page.getByRole('heading', { name: '브라우저 생성 검증', exact: true }).waitFor();
    await page.getByRole('button', { name: '브라우저 생성 검증 편집', exact: true }).click();
    await page.locator('#tag-name').fill('브라우저 수정 검증');
    await page.getByRole('dialog').getByRole('button', { name: '수정', exact: true }).click();
    await page.getByRole('heading', { name: '브라우저 수정 검증', exact: true }).waitFor();
    await page.getByRole('button', { name: '브라우저 수정 검증 삭제', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: '삭제', exact: true }).click();
    await page.getByRole('heading', { name: '브라우저 수정 검증', exact: true }).waitFor({ state: 'detached' });
  });
  await context.close();
}

(async () => {
  try {
    browser = await chromium.launch({ channel: process.env.ISOLATED_BROWSER_CHANNEL || 'chrome', headless: true, args: ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-quic', '--no-first-run', '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;localhost;[::1]'] });
    if (!process.argv.includes('--interactions-only')) await publicScreens();
    await publicInteractions();
    await adminInteractions();
    await responsiveAdminScreens();
    assert.deepEqual(report.blockedRequests, [], 'Unexpected external browser request attempted');
    assert.deepEqual(report.browserErrors, [], 'Unhandled browser errors');
    report.passed = true;
  } catch (error) {
    report.passed = false; report.error = error.stack; console.error(error); process.exitCode = 1;
  } finally {
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    await browser?.close();
    console.log(`Report: ${path.join(output, 'report.json')}`);
  }
})();
