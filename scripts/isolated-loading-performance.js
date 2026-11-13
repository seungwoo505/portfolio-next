// 동일한 합성 fixture의 초기 표시와 실제 네트워크 요청을 측정한다.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { assertLocalDestination, installNetworkGuard } = require('./isolated-network');
installNetworkGuard();
const { chromium } = require(process.env.ISOLATED_PLAYWRIGHT_PATH || 'C:/Users/QT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const phase = process.argv[2];
assert.ok(['before', 'after'].includes(phase));
const root = path.resolve(process.env.ISOLATED_PERFORMANCE_ROOT || path.join(__dirname, '../.verification/loading-optimization-20261113'));
const output = path.join(root, phase);
fs.mkdirSync(output, { recursive: true });
const baseUrl = process.env.ISOLATED_APP_URL || 'http://127.0.0.1:4318';
const apiUrl = process.env.ISOLATED_API_URL || 'http://127.0.0.1:4319';
assertLocalDestination(baseUrl); assertLocalDestination(apiUrl);
const origins = new Set([new URL(baseUrl).origin, new URL(apiUrl).origin]);
const cases = [false, true].flatMap(mobile => ['light', 'dark'].map(theme => ({ mobile, theme, name: `${mobile ? 'mobile' : 'desktop'}-${theme}` })));
const report = { phase, startedAt: new Date().toISOString(), baseUrl, apiUrl, nodeVersion: process.version, repeats: 5, delaysMs: { homeScripts: 300, blogPosts: 100, blogTags: 500, settings: 500, profile: 300 }, noJavaScript: [], samples: [], medians: [], blockedRequests: [], browserErrors: [] };
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
async function contextFor(options, javaScriptEnabled = true) {
  const context = await browser.newContext({ viewport: options.mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: options.mobile, deviceScaleFactor: 1, colorScheme: options.theme, reducedMotion: 'reduce', serviceWorkers: 'block', javaScriptEnabled });
  await context.addInitScript(theme => { try { localStorage.setItem('theme', theme); } catch {} }, options.theme);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['data:', 'blob:'].includes(url.protocol) || origins.has(url.origin)) return route.continue();
    report.blockedRequests.push(url.href); return route.abort('blockedbyclient');
  });
  if (context.routeWebSocket) await context.routeWebSocket('**/*', socket => {
    const url = new URL(socket.url()); url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    if (origins.has(url.origin)) socket.connectToServer(); else { report.blockedRequests.push(socket.url()); socket.close(); }
  });
  context.on('page', page => page.on('pageerror', error => report.browserErrors.push(error.message)));
  return context;
}
async function sample(options, mode, repeat) {
  const context = await contextFor(options);
  const pathname = mode === 'home' ? '/' : mode === 'blog' ? '/blog' : '/projects';
  const selector = mode === 'home' ? 'main h1' : mode === 'blog' ? '[aria-label="블로그 목록"] article' : '[aria-label="프로젝트 목록"] article';
  await context.addInitScript(({ selector, apiUrl }) => {
    const state = window.__loadingProbe = { targetMs: null, requests: [] };
    const original = window.fetch;
    window.fetch = function (...args) {
      const url = String(args[0] instanceof Request ? args[0].url : args[0]);
      const entry = url.startsWith(apiUrl + '/') ? { url, startMs: performance.now(), endMs: null } : null;
      if (entry) state.requests.push(entry);
      return original.apply(this, args).then(response => { if (entry) entry.endMs = performance.now(); return response; });
    };
    const inspect = () => {
      const target = document.querySelector(selector);
      if (target) { const rect = target.getBoundingClientRect(); const css = getComputedStyle(target); if (rect.width > 0 && rect.height > 0 && css.visibility !== 'hidden' && css.display !== 'none') { state.targetMs = performance.now(); return; } }
      requestAnimationFrame(inspect);
    };
    requestAnimationFrame(inspect);
  }, { selector, apiUrl });
  if (mode === 'home') await context.route(`${baseUrl}/_next/static/**/*.js`, async route => { await delay(report.delaysMs.homeScripts); await route.continue(); });
  await context.route(`${apiUrl}/**`, async route => {
    if (route.request().method() !== 'GET') return route.continue();
    const name = new URL(route.request().url()).pathname;
    const ms = mode === 'blog' && name === '/public/posts' ? report.delaysMs.blogPosts : mode === 'blog' && name === '/public/tags' ? report.delaysMs.blogTags : mode === 'requests' && name === '/public/settings' ? report.delaysMs.settings : mode === 'requests' && name === '/public/profile' ? report.delaysMs.profile : 0;
    if (!ms) return route.continue();
    const response = await route.fetch({ maxRedirects: 0 }); assert.ok(response.ok()); await delay(ms); await route.fulfill({ response });
  });
  try {
    const page = await context.newPage();
    const response = await page.goto(baseUrl + pathname, { waitUntil: 'networkidle', timeout: 60000 }); assert.ok(response.ok());
    await page.waitForFunction(() => window.__loadingProbe.targetMs !== null);
    const state = await page.evaluate(() => ({ ...window.__loadingProbe, responseStart: performance.getEntriesByType('navigation')[0].responseStart }));
    const settings = state.requests.filter(request => new URL(request.url).pathname === '/public/settings');
    const profile = state.requests.find(request => new URL(request.url).pathname === '/public/profile');
    const posts = state.requests.find(request => new URL(request.url).pathname === '/public/posts');
    const record = { case: options.name, mode, repeat, ...state, targetFromHtmlResponseMs: state.targetMs - state.responseStart, settingsRequests: settings.length, profileRequests: state.requests.filter(request => new URL(request.url).pathname === '/public/profile').length, profileStartGapMs: settings.length && profile ? profile.startMs - settings[0].startMs : null, footerRequestsCompleteMs: settings.length && profile ? Math.max(...settings.map(request => request.endMs), profile.endMs) - settings[0].startMs : null, blogCardFromPostsMs: posts ? state.targetMs - posts.startMs : null };
    report.samples.push(record);
  } finally { await context.close(); }
}
(async () => {
  try {
    browser = await chromium.launch({ channel: process.env.ISOLATED_BROWSER_CHANNEL || 'chrome', headless: true, args: ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-quic', '--no-first-run', '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;localhost;[::1]'] });
    for (const options of cases) {
      const context = await contextFor(options, false);
      try {
        const page = await context.newPage(); const response = await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 }); assert.ok(response.ok());
        report.noJavaScript.push({ case: options.name, headings: await page.locator('main h1').count(), featuredProjects: await page.locator('[data-project-image-role="list"]').count(), loadingStates: await page.locator('main [aria-label="페이지 불러오는 중"]').count() });
        await page.screenshot({ path: path.join(output, `${options.name}-home-no-js.png`), fullPage: true });
      } finally { await context.close(); }
      for (const mode of ['home', 'requests', 'blog']) {
        for (let repeat = 1; repeat <= report.repeats; repeat++) await sample(options, mode, repeat);
        const rows = report.samples.filter(row => row.case === options.name && row.mode === mode);
        const metrics = Object.fromEntries(['targetFromHtmlResponseMs', 'settingsRequests', 'profileRequests', 'profileStartGapMs', 'footerRequestsCompleteMs', 'blogCardFromPostsMs'].map(field => { const values = rows.map(row => row[field]).filter(Number.isFinite); return [field, values.length ? median(values) : null]; }));
        report.medians.push({ case: options.name, mode, count: rows.length, ...metrics });
        console.log(JSON.stringify({ phase, case: options.name, mode, ...metrics }));
        fs.writeFileSync(path.join(output, 'loading.json'), JSON.stringify(report, null, 2));
      }
    }
    assert.deepEqual(report.blockedRequests, []); assert.deepEqual(report.browserErrors, []); report.passed = true;
  } catch (error) { report.passed = false; report.error = error.stack; console.error(error); process.exitCode = 1; }
  finally { report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(output, 'loading.json'), JSON.stringify(report, null, 2)); await browser?.close(); }
})();
