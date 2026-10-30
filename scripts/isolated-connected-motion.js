// Synthetic local fixture checks only. This script never starts an application or API.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { assertLocalDestination } = require('./isolated-network');
const { chromium } = require(process.env.ISOLATED_PLAYWRIGHT_PATH || 'C:/Users/QT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseUrl = process.env.ISOLATED_APP_URL || 'http://127.0.0.1:4318';
const apiUrl = process.env.ISOLATED_API_URL || 'http://127.0.0.1:4319';
assertLocalDestination(baseUrl);
assertLocalDestination(apiUrl);
const origins = new Set([new URL(baseUrl).origin, new URL(apiUrl).origin]);
const output = path.resolve(__dirname, '../.verification/isolated-connected-motion');
const report = { startedAt: new Date().toISOString(), baseUrl, apiUrl, fixture: true, checks: [], blockedRequests: [], browserErrors: [] };
let browser;
let expectedFault = false;
async function contextFor(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference', serviceWorkers: 'block', ...options });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['data:', 'blob:'].includes(url.protocol) || origins.has(url.origin)) return route.continue();
    report.blockedRequests.push(url.toString());
    return route.abort('blockedbyclient');
  });
  if (context.routeWebSocket) await context.routeWebSocket('**/*', socket => {
    const url = new URL(socket.url());
    url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    if (origins.has(url.origin)) socket.connectToServer();
    else { report.blockedRequests.push(socket.url()); socket.close(); }
  });
  context.on('page', page => page.on('pageerror', error => report.browserErrors.push({ message: error.message, expectedFault })));
  // Observe from the first DOM mutation: the short-lived overlay can finish before click() resolves.
  await context.addInitScript(() => {
    const ids = new WeakMap();
    let sequence = 0;
    const state = window.__connectedMotion = { animations: [], cssAnimations: [], overlays: [], layouts: [], maxOverlays: 0, idFor(element) { if (!ids.has(element)) ids.set(element, ++sequence); return ids.get(element); } };
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = original.apply(this, args);
      const kind = this.matches('[data-hero-line]') ? 'hero' : this.matches('[data-nav-indicator]') ? 'nav' : this.matches('[data-layout-id]') ? 'layout' : this.matches('.project-image-transition') ? 'overlay' : null;
      if (kind) state.animations.push({ kind, id: state.idFor(this), layoutId: this.getAttribute('data-layout-id'), frames: args[0], duration: typeof args[1] === 'number' ? args[1] : args[1]?.duration, actualDuration: animation.effect?.getTiming().duration, playState: animation.playState, time: performance.now() });
      return animation;
    };
    document.addEventListener('animationstart', event => {
      if (event.target instanceof Element && event.target.matches('[data-hero-line]')) state.cssAnimations.push({ kind: 'hero', name: event.animationName, duration: getComputedStyle(event.target).animationDuration, id: state.idFor(event.target) });
    }, true);
    const seen = new WeakSet();
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const added of record.addedNodes) {
          if (!(added instanceof Element)) continue;
          const overlays = [...(added.matches('.project-image-transition') ? [added] : []), ...added.querySelectorAll('.project-image-transition')];
          for (const element of overlays) if (!seen.has(element)) {
            seen.add(element);
            const rect = element.getBoundingClientRect();
            state.overlays.push({ time: performance.now(), parent: element.parentElement?.tagName, ariaHidden: element.getAttribute('aria-hidden'), pointerEvents: getComputedStyle(element).pointerEvents, width: rect.width, height: rect.height });
          }
        }
      }
      state.maxOverlays = Math.max(state.maxOverlays, document.querySelectorAll('.project-image-transition').length);
      for (const container of document.querySelectorAll('[data-animated-list][data-layout-animating="true"]')) state.layouts.push({ time: performance.now(), items: [...container.querySelectorAll('[data-layout-id]')].map(element => ({ key: element.getAttribute('data-layout-id'), id: state.idFor(element) })) });
    });
    observer.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-layout-animating'] });
  });
  return context;
}
async function check(name, run) {
  try { await run(); report.checks.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); throw error; }
}
async function goto(page, pathname = '/') {
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'networkidle', timeout: 60000 });
  assert.ok(response?.ok(), `${pathname}: HTTP ${response?.status()}`);
  await page.locator('main').waitFor({ state: 'visible' });
}
async function projects(page) {
  await goto(page, '/projects');
  await page.locator('[data-project-image-role="list"]').first().waitFor({ state: 'visible' });
}
async function resetTrace(page) {
  await page.evaluate(() => { window.__connectedMotion.overlays.length = 0; window.__connectedMotion.animations.length = 0; window.__connectedMotion.maxOverlays = 0; });
}
async function assertOverlayStarted(page) {
  await page.waitForFunction(() => window.__connectedMotion.overlays.length > 0);
  const samples = await page.evaluate(() => window.__connectedMotion.overlays);
  assert.ok(samples.every(sample => sample.parent === 'BODY' && sample.ariaHidden === 'true' && sample.pointerEvents === 'none' && sample.width > 0 && sample.height > 0), JSON.stringify(samples));
}
async function assertOverlayGone(page, timeout = 4000) {
  await page.locator('.project-image-transition').waitFor({ state: 'detached', timeout });
}
async function assertSharedImageAnimation(page, slug, viewport) {
  await page.waitForFunction(() => window.__connectedMotion.animations.some(call => call.kind === 'overlay' && call.duration === 380), null, { timeout: 4000 });
  const calls = await page.evaluate(() => window.__connectedMotion.animations.filter(call => call.kind === 'overlay'));
  assert.equal(calls.length, 1, `Expected one actual shared-image animation: ${JSON.stringify(calls)}`);
  const animation = calls[0];
  assert.equal(animation.duration, 380);
  assert.equal(animation.actualDuration, 380);
  assert.equal(animation.playState, 'running', 'The shared-image animation was created without playing');
  assert.ok(Array.isArray(animation.frames) && animation.frames.length >= 2);
  const bounds = frame => Object.fromEntries(['left', 'top', 'width', 'height'].map(key => [key, Number.parseFloat(frame[key])]));
  const source = bounds(animation.frames[0]);
  const destination = bounds(animation.frames.at(-1));
  const target = await page.locator(`[data-project-image="${slug}"][data-project-image-role="detail"]`).evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  });
  const evidence = { viewport, slug, source, destination, actualDetailBounds: target, animation };
  (report.projectTransitions ||= []).push(evidence);
  assert.ok([...Object.values(source), ...Object.values(destination)].every(Number.isFinite), JSON.stringify(evidence));
  assert.ok(Object.keys(source).some(key => Math.abs(source[key] - destination[key]) > 0.5), `Overlay did not travel between different bounds: ${JSON.stringify(evidence)}`);
  assert.ok(Object.keys(destination).every(key => Math.abs(destination[key] - target[key]) < 3), `Overlay did not end at the actual detail image: ${JSON.stringify(evidence)}`);
}
async function clickImage(page) {
  const image = page.locator('[data-project-image-role="list"]').first();
  await image.scrollIntoViewIfNeeded();
  const slug = await image.getAttribute('data-project-image');
  assert.ok(slug);
  const link = image.locator('xpath=ancestor-or-self::a[@data-project-link][1]');
  assert.equal(await link.getAttribute('data-project-link'), slug);
  assert.equal(new URL(await link.getAttribute('href'), baseUrl).pathname, `/projects/${encodeURIComponent(slug)}`);
  await resetTrace(page);
  await image.click({ noWaitAfter: true });
  return slug;
}
async function detailVisible(page, slug) {
  await page.waitForURL(url => url.pathname === `/projects/${encodeURIComponent(slug)}`, { timeout: 15000 });
  const image = page.locator(`[data-project-image="${slug}"][data-project-image-role="detail"]`);
  await image.waitFor({ state: 'visible' });
  await image.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  assert.ok(await image.evaluate(element => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; }));
}
async function fillContact(page) {
  for (const [id, value] of Object.entries({ name: '[검증] 모션 방문자', email: 'connected-motion@example.invalid', subject: '[검증] 상태 연결', message: '로컬 fixture 전송 상태와 입력 보존 검증입니다.' })) await page.locator(`#${id}`).fill(value);
}
const contactState = page => page.locator('[data-submit-state]').first();
const checkIcon = page => contactState(page).locator('[data-submit-check], [class*="lucide-check"], [class*="lucide-circle-check"]');
async function withDetailFault(page, mode) {
  await projects(page);
  const slug = await page.locator('[data-project-image-role="list"]').first().getAttribute('data-project-image');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const pattern = url => {
    const parsed = new URL(url);
    return (parsed.origin === new URL(baseUrl).origin && parsed.pathname === `/projects/${slug}`) || (parsed.origin === new URL(apiUrl).origin && parsed.pathname.includes(`/projects/`) && parsed.pathname.includes(slug) && !parsed.pathname.endsWith('/view'));
  };
  const handler = async route => {
    if (mode === 'slow') { await gate; return route.continue(); }
    return route.fulfill({ status: 500, contentType: 'text/plain', headers: { 'Access-Control-Allow-Origin': new URL(baseUrl).origin }, body: 'Isolated fixture detail failure' });
  };
  await page.route(pattern, handler);
  expectedFault = mode === 'failure';
  try {
    await clickImage(page);
    if (mode === 'slow') {
      await assertOverlayStarted(page);
      await assertOverlayGone(page); // Cleanup must happen while route/data are still pending.
      release();
      await detailVisible(page, slug);
    } else {
      // A Next server error may replace the document. Either route outcome must release the overlay.
      await page.waitForTimeout(1800);
      await assertOverlayGone(page);
      assert.ok((await page.locator('body').innerText()).trim().length > 0);
    }
  } finally { release(); await page.unroute(pattern, handler); expectedFault = false; }
}
async function assertSupersededRouteCleanup(page) {
  await projects(page);
  const slug = await page.locator('[data-project-image-role="list"]').first().getAttribute('data-project-image');
  const pathname = `/projects/${encodeURIComponent(slug)}`;
  const pattern = url => new URL(url).origin === new URL(baseUrl).origin && new URL(url).pathname === pathname;
  let release;
  let released = false;
  const gate = new Promise(resolve => { release = () => { released = true; resolve(); }; });
  const handler = async route => {
    await gate;
    // A superseded native navigation can cancel its held RSC request.
    try { await route.continue(); } catch (error) {
      if (!/handled|cancel|closed|disposed/i.test(error.message)) throw error;
    }
  };
  await page.route(pattern, handler);
  try {
    const request = page.waitForRequest(value => new URL(value.url()).origin === new URL(baseUrl).origin && new URL(value.url()).pathname === pathname, { timeout: 4000 });
    await clickImage(page);
    await request;
    await assertOverlayStarted(page);
    assert.equal(await page.locator('.project-image-transition').count(), 1, 'The detail transition must still be pending before the second click');
    // Observe at the end of the actual header click event, before any timeout or
    // RSC response can clean it up. This distinguishes cancellation from expiry.
    await page.evaluate(() => {
      window.__supersededRouteClick = null;
      const observe = event => {
        const anchor = event.target instanceof Element ? event.target.closest('a') : null;
        if (!anchor || new URL(anchor.href).pathname !== '/about') return;
        window.__supersededRouteClick = { overlays: document.querySelectorAll('.project-image-transition').length, time: performance.now() };
        document.removeEventListener('click', observe);
      };
      document.addEventListener('click', observe);
    });
    await page.getByRole('navigation', { name: '주요 메뉴', exact: true }).locator('a[href="/about"]').click({ noWaitAfter: true });
    const observed = await page.evaluate(() => window.__supersededRouteClick);
    assert.ok(observed, 'Native header click was not observed');
    assert.equal(released, false, 'The delayed detail response was released too early');
    assert.equal(observed.overlays, 0, 'Superseded project overlay survived the header navigation click');
    await page.waitForURL(`${baseUrl}/about`);
    await assertOverlayGone(page);
    report.supersededRoute = { delayedPathname: pathname, observed };
    release();
    await page.waitForTimeout(100);
    assert.equal(new URL(page.url()).pathname, '/about', 'The old detail response replaced the newer route');
  } finally { release(); await page.unroute(pattern, handler); }
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  try {
    browser = await chromium.launch({ channel: process.env.ISOLATED_BROWSER_CHANNEL || 'chrome', headless: true, args: ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-quic', '--no-first-run', '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;localhost;[::1]'] });
    const context = await contextFor();
    const page = await context.newPage();
    if (process.argv.includes('--race-only')) {
      await check('header navigation cancels a held detail transition synchronously', () => assertSupersededRouteCleanup(page));
      assert.deepEqual(report.blockedRequests, []);
      assert.deepEqual(report.browserErrors, []);
      report.passed = true;
      await context.close();
      return;
    }
    await check('navigation indicator follows the actual active route link', async () => {
      await goto(page);
      const nav = page.getByRole('navigation', { name: '주요 메뉴', exact: true });
      const indicator = nav.locator('[data-nav-indicator]');
      await indicator.waitFor();
      const original = await indicator.boundingBox();
      await nav.locator('a[href="/about"]').click();
      await page.waitForURL(`${baseUrl}/about`);
      await page.waitForTimeout(350);
      const active = nav.locator('a[aria-current="page"]');
      assert.equal(await active.getAttribute('href'), '/about');
      const actual = await indicator.boundingBox();
      const target = await active.boundingBox();
      assert.ok(actual && target && original);
      assert.ok(Math.abs(actual.x - target.x) < 3 && Math.abs(actual.width - target.width) < 3, JSON.stringify({ actual, target }));
      assert.ok(Math.abs(actual.x - original.x) > 5, 'Indicator did not move');
    });
    await check('hero line draws for 650 ms once without replay on scroll', async () => {
      await goto(page);
      const line = page.locator('[data-hero-line]').first();
      await line.waitFor({ state: 'attached' });
      // A stroked vertical SVG path legitimately has zero geometric width.
      await page.locator('.hero-process-connection').waitFor({ state: 'visible' });
      await page.waitForTimeout(750);
      const read = () => page.evaluate(() => { const state = window.__connectedMotion; return [...state.animations.filter(call => call.kind === 'hero'), ...state.cssAnimations]; });
      const before = await read();
      assert.equal(before.length, 1, JSON.stringify(before));
      assert.equal(before[0].duration === '0.65s' ? 650 : Number(before[0].duration), 650);
      await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(150);
      assert.equal((await read()).length, 1);
      report.hero = before[0];
    });
    await check('filtered retained cards move for 240 ms after the list updates', async () => {
      await projects(page);
      const list = page.locator('[data-animated-list]').first();
      const before = await list.locator('[data-layout-id]').evaluateAll(elements => elements.map(element => ({ key: element.getAttribute('data-layout-id'), id: window.__connectedMotion.idFor(element) })));
      await page.evaluate(() => { window.__connectedMotion.layouts.length = 0; window.__connectedMotion.animations.length = 0; });
      await page.locator('[aria-label="기술 스택 필터"]').getByRole('button', { name: 'API 설계', exact: true }).click();
      await page.waitForFunction(() => window.__connectedMotion.layouts.length > 0);
      const during = await page.evaluate(() => window.__connectedMotion.layouts[0].items);
      assert.notDeepEqual(during.map(item => item.key), before.map(item => item.key));
      const retained = during.filter(item => before.some(old => old.key === item.key));
      assert.ok(retained.length >= 2);
      assert.ok(retained.every(item => before.find(old => old.key === item.key).id === item.id), 'Retained card DOM was replaced');
      const animations = await page.evaluate(() => window.__connectedMotion.animations.filter(call => call.kind === 'layout'));
      assert.ok(animations.some(call => call.duration === 240 && JSON.stringify(call.frames).includes('transform')), JSON.stringify(animations));
      await page.waitForFunction(() => !document.querySelector('[data-layout-animating="true"]'));
      report.retainedList = { before, during, animations };
    });
    await check('contact pending disables submit and success check waits for API success', async () => {
      await goto(page, '/contact');
      await fillContact(page);
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      const pattern = `${apiUrl}/public/contact`;
      const handler = async route => { if (route.request().method() === 'POST') await gate; await route.continue(); };
      await page.route(pattern, handler);
      try {
        await page.locator('form button[type="submit"]').click();
        await page.waitForFunction(() => document.querySelector('[data-submit-state="pending"]'));
        assert.ok(await page.locator('form button[type="submit"]').isDisabled());
        assert.equal(await checkIcon(page).count(), 0);
        release();
        await page.waitForFunction(() => document.querySelector('[data-submit-state="success"]'));
        assert.ok(await checkIcon(page).count() > 0);
        assert.equal(await page.locator('#message').inputValue(), '');
        await page.locator('#name').fill('다음 메시지');
        assert.equal(await contactState(page).getAttribute('data-submit-state'), 'idle');
      } finally { release(); await page.unroute(pattern, handler); }
    });
    await check('contact error preserves input and editing returns to idle', async () => {
      await fillContact(page);
      const expected = await page.locator('#message').inputValue();
      const pattern = `${apiUrl}/public/contact`;
      const handler = route => route.fulfill({ status: 503, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': new URL(baseUrl).origin }, body: JSON.stringify({ success: false, message: '로컬 fixture 오류' }) });
      await page.route(pattern, handler);
      try {
        await page.locator('form button[type="submit"]').click();
        await page.waitForFunction(() => document.querySelector('[data-submit-state="error"]'));
        assert.equal(await page.locator('#message').inputValue(), expected);
        assert.equal(await checkIcon(page).count(), 0);
        assert.ok(await page.locator('form button[type="submit"]').isEnabled());
        await page.locator('#message').fill(`${expected} 다시 작성`);
        assert.equal(await contactState(page).getAttribute('data-submit-state'), 'idle');
      } finally { await page.unroute(pattern, handler); }
    });
    await check('project image connects to detail and native Back restores normal list and visible card area', async () => {
      await projects(page);
      report.backNavigationScope = {
        verified: 'Default all-projects list keys, visible card area, native Back, and detail view increment; filtered list movement is checked separately.',
        limitation: 'Filtered state persistence across route remount is not a pre-existing behavior and is not claimed by this test.',
        evidence: 'HEAD and current src/app/(site)/projects/page.tsx initialize selectedTechs with useState<string[]>([]) and provide no URL/history/session restoration.',
      };
      await page.locator('[data-project-image-role="list"]').first().scrollIntoViewIfNeeded();
      const beforeKeys = await page.locator('[data-animated-list] [data-layout-id]').evaluateAll(elements => elements.map(element => element.getAttribute('data-layout-id')));
      let viewRequests = 0;
      const viewListener = request => { if (request.method() === 'POST' && request.url().startsWith(apiUrl) && /\/view(?:\?|$)/.test(request.url())) viewRequests++; };
      page.on('request', viewListener);
      const slug = await clickImage(page);
      await assertOverlayStarted(page);
      await detailVisible(page, slug);
      await assertOverlayGone(page);
      await assertSharedImageAnimation(page, slug, 'desktop');
      assert.ok(viewRequests >= 1, 'Detail view increment request was lost');
      page.off('request', viewListener);
      await page.goBack({ waitUntil: 'networkidle' });
      await page.locator('[data-project-image-role="list"]').first().waitFor();
      assert.equal(await page.locator('[data-all-projects]').getAttribute('aria-pressed'), 'true');
      assert.deepEqual(await page.locator('[data-animated-list] [data-layout-id]').evaluateAll(elements => elements.map(element => element.getAttribute('data-layout-id'))), beforeKeys);
      assert.ok(await page.locator('[data-project-image-role="list"]').first().evaluate(element => { const rect = element.getBoundingClientRect(); return rect.bottom > 0 && rect.top < innerHeight; }), 'Back did not restore the visible card area');
    });
    await check('home featured image plays the actual shared transition to detail bounds', async () => {
      await goto(page);
      await page.locator('[data-project-image-role="list"]').first().waitFor({ state: 'visible' });
      const slug = await clickImage(page);
      await assertOverlayStarted(page);
      await detailVisible(page, slug);
      await assertOverlayGone(page);
      await assertSharedImageAnimation(page, slug, 'home-desktop');
    });
    await check('modified project anchor click preserves native new-tab behavior', async () => {
      await projects(page);
      await resetTrace(page);
      const image = page.locator('[data-project-image-role="list"]').first();
      const popupPromise = context.waitForEvent('page');
      await image.click({ modifiers: ['Control'] });
      const popup = await popupPromise;
      try {
        await popup.waitForLoadState('domcontentloaded');
        assert.equal(new URL(page.url()).pathname, '/projects');
        assert.ok(new URL(popup.url()).pathname.startsWith('/projects/'));
        assert.equal(await page.evaluate(() => window.__connectedMotion.overlays.length), 0);
      } finally { await popup.close(); }
    });
    await check('slow detail releases overlay before the pending navigation completes', () => withDetailFault(page, 'slow'));
    await check('failed detail route never leaves an overlay covering the page', () => withDetailFault(page, 'failure'));
    await check('Escape and immediate second navigation clean up the transition', async () => {
      await assertSupersededRouteCleanup(page);
      await projects(page);
      const slug = await clickImage(page);
      await page.keyboard.press('Escape');
      await assertOverlayGone(page);
      await detailVisible(page, slug);
      await projects(page);
      await clickImage(page);
      // Use native browser Back during a still-running transition; do not replace routing with a test hook.
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);
      await assertOverlayGone(page);
      assert.ok(await page.evaluate(() => window.__connectedMotion.maxOverlays <= 1));
    });
    await context.close();
    await check('reduced motion navigates immediately without a shared overlay or hero draw', async () => {
      const reduced = await contextFor({ reducedMotion: 'reduce' });
      try {
        const reducedPage = await reduced.newPage();
        await goto(reducedPage);
        assert.equal(await reducedPage.evaluate(() => window.__connectedMotion.animations.filter(call => call.kind === 'hero').length + window.__connectedMotion.cssAnimations.length), 0);
        await projects(reducedPage);
        const slug = await clickImage(reducedPage);
        await detailVisible(reducedPage, slug);
        assert.equal(await reducedPage.evaluate(() => window.__connectedMotion.overlays.length), 0);
        await assertOverlayGone(reducedPage);
      } finally { await reduced.close(); }
    });
    await check('mobile image transition reaches visible detail without horizontal overflow', async () => {
      const mobile = await contextFor({ viewport: { width: 390, height: 844 }, isMobile: true });
      try {
        const mobilePage = await mobile.newPage();
        await projects(mobilePage);
        const slug = await clickImage(mobilePage);
        await assertOverlayStarted(mobilePage);
        await detailVisible(mobilePage, slug);
        await assertOverlayGone(mobilePage);
        await assertSharedImageAnimation(mobilePage, slug, 'mobile');
        assert.ok(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      } finally { await mobile.close(); }
    });
    assert.deepEqual(report.blockedRequests, [], 'Unexpected external request attempted');
    assert.deepEqual(report.browserErrors.filter(error => !error.expectedFault), [], 'Unhandled browser errors outside intentional detail failure');
    report.passed = true;
  } catch (error) {
    report.passed = false;
    report.error = error.stack;
    console.error(error);
    process.exitCode = 1;
  } finally {
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    await browser?.close();
    console.log(`Report: ${path.join(output, 'report.json')}`);
  }
})();
