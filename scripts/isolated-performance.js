// Synthetic fixtures only. Start the guarded local preview separately; this tool starts no servers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { gzipSync } = require('node:zlib');
const { assertLocalDestination, installNetworkGuard } = require('./isolated-network');
installNetworkGuard();
const { chromium } = require(process.env.ISOLATED_PLAYWRIGHT_PATH || 'C:/Users/QT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const arg = (name, fallback) => { const index = process.argv.indexOf(name); return index < 0 ? fallback : process.argv[index + 1]; };
const phase = arg('--phase', 'before');
const only = arg('--only', 'all');
const repeats = Number(arg('--repeats', '3'));
assert.ok(['before', 'css', 'images', 'after'].includes(phase), 'Invalid --phase');
assert.ok(['all', 'timing', 'screens', 'summary'].includes(only), 'Invalid --only');
assert.ok(Number.isInteger(repeats) && repeats >= 1 && repeats <= 10, 'Invalid --repeats');
const baseUrl = process.env.ISOLATED_APP_URL || 'http://127.0.0.1:4318';
const apiUrl = process.env.ISOLATED_API_URL || 'http://127.0.0.1:4319';
assertLocalDestination(baseUrl); assertLocalDestination(apiUrl);
const origins = new Set([new URL(baseUrl).origin, new URL(apiUrl).origin]);
const output = path.resolve(__dirname, `../.verification/performance/${phase}`);
const reportFile = path.join(output, 'report.json');
fs.mkdirSync(output, { recursive: true });
const report = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, 'utf8')) : {};
Object.assign(report, { phase, startedAt: new Date().toISOString(), baseUrl, apiUrl, fixture: true, nodeVersion: process.version, nextVersion: require('next/package.json').version, syntheticRasterWarning: 'Deterministic synthetic JPEG; these byte and delay measurements do not predict production speed.', blockedRequests: [], browserErrors: [] });
const publicPaths = ['/', '/projects', '/projects/fixture-project-1', '/blog', '/blog/fixture-post-1', '/about', '/contact', '/settings'];
const cases = [false, true].flatMap(mobile => ['light', 'dark'].map(theme => ({ mobile, theme })));
const label = ({ mobile, theme }) => `${mobile ? 'mobile' : 'desktop'}-${theme}`;
const median = values => { const sorted = [...values].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; };
let browser;

async function contextFor(options) {
  const context = await browser.newContext({ viewport: options.mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: options.mobile, deviceScaleFactor: 1, colorScheme: options.theme, reducedMotion: 'reduce', serviceWorkers: 'block' });
  await context.addInitScript(theme => { try { localStorage.setItem('theme', theme); } catch {} }, options.theme);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['data:', 'blob:'].includes(url.protocol) || origins.has(url.origin)) return route.continue();
    report.blockedRequests.push(url.href); return route.abort('blockedbyclient');
  });
  if (context.routeWebSocket) await context.routeWebSocket('**/*', socket => {
    const url = new URL(socket.url()); url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    if (origins.has(url.origin)) socket.connectToServer();
    else { report.blockedRequests.push(socket.url()); socket.close(); }
  });
  context.on('page', page => page.on('pageerror', error => report.browserErrors.push(error.message)));
  return context;
}

async function localAsset(context, url) {
  assertLocalDestination(url); assert.ok(origins.has(new URL(url).origin), `Unapproved origin ${url}`);
  const response = await context.request.get(url, { maxRedirects: 0 });
  assert.ok(response.ok(), `Asset ${response.status()} ${url}`);
  return { body: await response.body(), headers: response.headers() };
}

async function screens() {
  report.pages = []; const cssAssets = new Map();
  for (const options of cases) for (const pathname of publicPaths) {
    const context = await contextFor(options); const page = await context.newPage();
    const responses = []; const pending = [];
    page.on('response', response => {
      const request = response.request(); const url = new URL(response.url());
      if (!origins.has(url.origin)) return;
      if (request.resourceType() === 'image' || url.pathname.startsWith('/_next/image') || url.origin === new URL(apiUrl).origin) {
        pending.push((async () => {
          await response.finished();
          const headers = await response.allHeaders();
          let bodyBytes = null; try { bodyBytes = (await response.body()).length; } catch {}
          let sizes = null; try { sizes = await request.sizes(); } catch {}
          responses.push({ url: url.href, method: request.method(), type: request.resourceType(), status: response.status(), contentType: headers['content-type'], contentEncoding: headers['content-encoding'] || null, contentLength: Number(headers['content-length']) || null, decodedBodyBytes: bodyBytes, networkSizes: sizes, nextImageWidth: url.pathname.startsWith('/_next/image') ? Number(url.searchParams.get('w')) : null, requestHeaders: { accept: request.headers().accept || null } });
        })());
      }
    });
    try {
      const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'networkidle', timeout: 60000 });
      assert.ok(response?.ok(), `${pathname} HTTP ${response?.status()}`);
      await page.locator('main').first().waitFor({ state: 'visible' });
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter(img => img.getBoundingClientRect().top < innerHeight).map(img => img.decode().catch(() => {}))); });
      await page.waitForFunction(theme => document.documentElement.classList.contains('dark') === (theme === 'dark'), options.theme);
      await page.evaluate(async () => {
        const limit = document.documentElement.scrollHeight;
        for (let y = 0; y < limit; y += Math.max(200, innerHeight * .7)) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise(resolve => setTimeout(resolve, 35));
        }
        await Promise.race([Promise.all([...document.images].map(img => img.decode().catch(() => {}))), new Promise(resolve => setTimeout(resolve, 1200))]);
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      await page.waitForTimeout(100);
      const metrics = await page.evaluate(() => {
        const rectOf = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
        const selectors = ['body', 'header', 'main', 'footer', 'h1', 'main h2', 'main p', 'main button', '.prose-content h2', '.prose-content p', '.prose-content li', '.prose-content blockquote', '.prose-content pre', '.prose-content table', '.prose-content th', '.prose-content td', '.prose-content img', '.prose-content figcaption', '.prose-content [data-text-alignment]', '[data-project-image-role]'];
        return {
          title: document.title, viewport: { width: innerWidth, height: innerHeight }, document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
          bodyText: document.body.innerText, stylesheetUrls: [...document.querySelectorAll('link[rel="stylesheet"]')].map(link => link.href),
          fonts: [...document.fonts].map(font => ({ family: font.family, style: font.style, weight: font.weight, status: font.status })),
          fontResources: performance.getEntriesByType('resource').filter(entry => /\.(woff2?|ttf|otf)(\?|$)/i.test(entry.name)).map(entry => ({ url: entry.name, transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize, decodedBodySize: entry.decodedBodySize })),
          design: selectors.flatMap(selector => [...document.querySelectorAll(selector)].slice(0, 12).map((element, index) => { const css = getComputedStyle(element); return { selector, index, text: element.textContent.trim().slice(0, 180), rect: rectOf(element), fontFamily: css.fontFamily, fontSize: css.fontSize, fontWeight: css.fontWeight, lineHeight: css.lineHeight, color: css.color, backgroundColor: css.backgroundColor, display: css.display, objectFit: css.objectFit, textAlign: css.textAlign, justifyContent: css.justifyContent, listStyleType: css.listStyleType, fontStyle: css.fontStyle, whiteSpace: css.whiteSpace, padding: css.padding }; })),
          images: [...document.images].map(img => { const rect = img.getBoundingClientRect(); return { src: img.src, currentSrc: img.currentSrc, srcset: img.srcset, sizes: img.sizes, alt: img.alt, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, complete: img.complete, initialViewport: rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth, rect: rectOf(img) }; }),
          resources: performance.getEntriesByType('resource').map(entry => ({ url: entry.name, initiatorType: entry.initiatorType, startTime: entry.startTime, duration: entry.duration, transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize, decodedBodySize: entry.decodedBodySize })),
        };
      });
      for (const url of [...new Set(metrics.stylesheetUrls)]) if (!cssAssets.has(url)) {
        const { body, headers } = await localAsset(context, url); const text = body.toString('utf8');
        cssAssets.set(url, { url, rawBytes: body.length, gzipBytes: gzipSync(body).length, contentType: headers['content-type'], markers: { blocknote: /blocknote|bn-editor|\.bn-/i.test(text), mantine: /mantine|--mantine/i.test(text), interFont: /InterVariable|Inter var|Inter-/i.test(text), prose: /prose-content|project-block-content|blog-post-block-content/.test(text) }, fontFaceCount: (text.match(/@font-face/g) || []).length });
      }
      const name = `${label(options)}-${pathname === '/' ? 'home' : pathname.slice(1).replaceAll('/', '_')}`;
      await page.screenshot({ path: path.join(output, `${name}-viewport.png`), animations: 'disabled' });
      await page.screenshot({ path: path.join(output, `${name}-full.png`), fullPage: true, animations: 'disabled' });
      await Promise.all(pending);
      const uniqueCss = [...new Set(metrics.stylesheetUrls)].map(url => cssAssets.get(url));
      report.pages.push({ case: label(options), pathname, screenshotPrefix: name, ...metrics, css: { uniqueUrls: uniqueCss.map(asset => asset.url), rawBytes: uniqueCss.reduce((sum, asset) => sum + asset.rawBytes, 0), gzipBytes: uniqueCss.reduce((sum, asset) => sum + asset.gzipBytes, 0) }, imageAndApiResponses: responses });
      console.log(`SCREEN ${phase} ${name}: CSS ${report.pages.at(-1).css.rawBytes} bytes`);
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    } finally { await context.close(); }
  }
  report.cssAssets = [...cssAssets.values()];
  report.cssTotals = { uniqueUrls: cssAssets.size, rawBytes: report.cssAssets.reduce((sum, asset) => sum + asset.rawBytes, 0), gzipBytes: report.cssAssets.reduce((sum, asset) => sum + asset.gzipBytes, 0) };
  const sourceContext = await contextFor(cases[0]);
  try {
    const url = `${apiUrl}/__fixture/images/cover.jpg`; const { body, headers } = await localAsset(sourceContext, url);
    report.rasterSource = { url, bytes: body.length, contentType: headers['content-type'], width: 2560, height: 1440 };
  } finally { await sourceContext.close(); }
}

async function timings() {
  report.projectTiming = { delaysMs: { projects: 100, settings: 500 }, repeats, samples: [], medians: [] };
  for (const options of cases) {
    const samples = [];
    for (let repeat = 0; repeat < repeats; repeat++) {
      const context = await contextFor(options);
      await context.addInitScript(() => {
        const state = window.__performanceFixture = { requests: [], firstCardMs: null };
        const originalFetch = window.fetch;
        window.fetch = function (...args) { const url = String(args[0] instanceof Request ? args[0].url : args[0]); if (/\/(?:public\/)?(?:projects|settings)(?:\?|$)/.test(url)) state.requests.push({ url, startMs: performance.now() }); return originalFetch.apply(this, args); };
        const inspect = () => { const card = document.querySelector('[aria-label="프로젝트 목록"] [data-project-image-role="list"]'); if (card) { const rect = card.getBoundingClientRect(); const style = getComputedStyle(card); if (rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none') { state.firstCardMs = performance.now(); return; } } requestAnimationFrame(inspect); };
        requestAnimationFrame(inspect);
      });
      const routeCalls = [];
      await context.route(`${apiUrl}/**`, async route => {
        const url = new URL(route.request().url());
        const kind = /\/(?:public\/)?projects$/.test(url.pathname) ? 'projects' : /\/(?:public\/)?settings$/.test(url.pathname) ? 'settings' : null;
        if (route.request().method() !== 'GET' || !kind) return route.continue();
        const started = Date.now(); const response = await route.fetch({ maxRedirects: 0 });
        assert.ok(response.ok(), `Timing fixture failed: ${url.href}`);
        const delayMs = kind === 'projects' ? 100 : 500;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        routeCalls.push({ kind, url: url.href, delayMs, actualRouteMs: Date.now() - started });
        return route.fulfill({ response });
      });
      try {
        const page = await context.newPage();
        await page.goto(`${baseUrl}/projects`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForFunction(() => window.__performanceFixture.firstCardMs !== null);
        await page.waitForLoadState('networkidle');
        const state = await page.evaluate(() => window.__performanceFixture);
        const projects = state.requests.find(request => /\/(?:public\/)?projects(?:\?|$)/.test(request.url));
        const settings = state.requests.filter(request => /\/(?:public\/)?settings(?:\?|$)/.test(request.url)).at(-1);
        assert.ok(projects && settings, 'Both local list/settings requests must be observed');
        const sample = { case: label(options), repeat: repeat + 1, firstCardMs: state.firstCardMs, projectsRequestStartMs: projects.startMs, settingsRequestStartMs: settings.startMs, requestStartGapMs: settings.startMs - projects.startMs, cardFromProjectsRequestMs: state.firstCardMs - projects.startMs, requests: state.requests, routeCalls };
        samples.push(sample); report.projectTiming.samples.push(sample);
        console.log(`TIMING ${phase} ${sample.case} #${repeat + 1}: card ${sample.cardFromProjectsRequestMs.toFixed(1)}ms gap ${sample.requestStartGapMs.toFixed(1)}ms`);
      } finally { await context.close(); }
    }
    report.projectTiming.medians.push({ case: label(options), firstCardMs: median(samples.map(sample => sample.firstCardMs)), projectsRequestStartMs: median(samples.map(sample => sample.projectsRequestStartMs)), settingsRequestStartMs: median(samples.map(sample => sample.settingsRequestStartMs)), requestStartGapMs: median(samples.map(sample => sample.requestStartGapMs)), cardFromProjectsRequestMs: median(samples.map(sample => sample.cardFromProjectsRequestMs)) });
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  }
}

function summary() {
  const baselineFile = path.resolve(output, '../before/report.json');
  if (!fs.existsSync(baselineFile)) return;
  const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  report.comparison = { baseline: 'before', pages: (report.pages || []).map(page => { const old = baseline.pages?.find(item => item.case === page.case && item.pathname === page.pathname); if (!old) return null; return { case: page.case, pathname: page.pathname, cssRawBytesBefore: old.css.rawBytes, cssRawBytesAfter: page.css.rawBytes, cssGzipBytesBefore: old.css.gzipBytes, cssGzipBytesAfter: page.css.gzipBytes, bodyTextEqual: old.bodyText === page.bodyText, designMetricsEqual: JSON.stringify(old.design) === JSON.stringify(page.design), imageLayoutEqual: JSON.stringify(old.images.map(img => img.rect)) === JSON.stringify(page.images.map(img => img.rect)), viewportEqual: JSON.stringify(old.viewport) === JSON.stringify(page.viewport), documentEqual: JSON.stringify(old.document) === JSON.stringify(page.document) }; }).filter(Boolean), timing: (report.projectTiming?.medians || []).map(sample => { const old = baseline.projectTiming?.medians?.find(item => item.case === sample.case); return { case: sample.case, beforeMs: old?.cardFromProjectsRequestMs, afterMs: sample.cardFromProjectsRequestMs }; }) };
}

(async () => {
  try {
    if (only !== 'summary') browser = await chromium.launch({ channel: process.env.ISOLATED_BROWSER_CHANNEL || 'chrome', headless: true, args: ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-quic', '--no-first-run', '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;localhost;[::1]'] });
    if (['all', 'screens'].includes(only)) await screens();
    if (['all', 'timing'].includes(only)) await timings();
    summary();
    assert.deepEqual(report.blockedRequests, [], 'Unexpected external request');
    assert.deepEqual(report.browserErrors, [], 'Unhandled browser errors');
    report.passed = true;
  } catch (error) { report.passed = false; report.error = error.stack; console.error(error); process.exitCode = 1; }
  finally { report.finishedAt = new Date().toISOString(); fs.writeFileSync(reportFile, JSON.stringify(report, null, 2)); await browser?.close(); console.log(`Report: ${reportFile}`); }
})();
