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
const output = path.resolve(__dirname, '../.verification/isolated-motion');
const report = { startedAt: new Date().toISOString(), baseUrl, fixture: true, checks: [], blockedRequests: [], browserErrors: [] };
let browser;
async function contextFor(options = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference', serviceWorkers: 'block', ...options });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['data:', 'blob:'].includes(url.protocol) || origins.has(url.origin)) return route.continue();
    report.blockedRequests.push(url.toString());
    return route.abort('blockedbyclient');
  });
  if (context.routeWebSocket) await context.routeWebSocket('**/*', socket => {
    const url = new URL(socket.url());
    if (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) socket.connectToServer();
    else { report.blockedRequests.push(url.toString()); socket.close(); }
  });
  context.on('page', page => page.on('pageerror', error => report.browserErrors.push(error.message)));
  await context.addInitScript(() => {
    const ids = new WeakMap();
    let sequence = 0;
    window.__motionTest = { calls: [], idFor(element) { if (!ids.has(element)) ids.set(element, ++sequence); return ids.get(element); } };
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = original.apply(this, args);
      if (this.matches('[data-reveal]')) window.__motionTest.calls.push({ id: window.__motionTest.idFor(this), frames: args[0], options: args[1] });
      return animation;
    };
  });
  return context;
}
async function check(name, fn) {
  try { await fn(); report.checks.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); throw error; }
}
async function goto(page, pathname = '/') {
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'networkidle', timeout: 60000 });
  assert.ok(response.ok(), `HTTP ${response.status()}`);
  await page.getByRole('heading', { level: 1 }).waitFor();
}
async function visible(page) {
  assert.ok((await page.locator('main').innerText()).trim().length > 30);
  assert.equal(await page.locator('[data-reveal]').evaluateAll(elements => elements.filter(element => {
    const style = getComputedStyle(element);
    return style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0;
  }).length), 0);
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  try {
    browser = await chromium.launch({ channel: process.env.ISOLATED_BROWSER_CHANNEL || 'chrome', headless: true, args: ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-quic', '--no-first-run', '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;localhost;[::1]'] });
    const context = await contextFor();
    const page = await context.newPage();
    let targetId;
    await check('real below-fold motion is restrained', async () => {
      await goto(page);
      await visible(page);
      targetId = await page.evaluate(() => {
        const target = [...document.querySelectorAll('[data-reveal]')].find(element => element.getBoundingClientRect().top > innerHeight + 10);
        if (!target) throw new Error('No below-fold reveal target');
        window.__revealTarget = target;
        return window.__motionTest.idFor(target);
      });
      await page.evaluate(() => window.__revealTarget.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForFunction(id => window.__motionTest.calls.some(call => call.id === id), targetId);
      const calls = await page.evaluate(id => window.__motionTest.calls.filter(call => call.id === id), targetId);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].options.duration, 380);
      assert.equal(calls[0].options.delay || 0, 0);
      assert.equal(calls[0].options.fill || 'none', 'none');
      assert.ok(JSON.stringify(calls[0].frames).includes('8px'));
      report.motionExample = calls[0];
    });
    await check('reentering viewport does not replay', async () => {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(450);
      await page.evaluate(() => window.__revealTarget.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(450);
      assert.equal(await page.evaluate(id => window.__motionTest.calls.filter(call => call.id === id).length, targetId), 1);
    });
    await context.close();
    await check('initial reduced motion keeps all content visible', async () => {
      const reduced = await contextFor({ reducedMotion: 'reduce' });
      try {
        const reducedPage = await reduced.newPage();
        await goto(reducedPage);
        await reducedPage.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
        await reducedPage.waitForTimeout(450);
        await visible(reducedPage);
        assert.equal(await reducedPage.evaluate(() => window.__motionTest.calls.length), 0);
      } finally { await reduced.close(); }
    });
    await check('JavaScript disabled keeps server content visible', async () => {
      const noJs = await contextFor({ javaScriptEnabled: false });
      try {
        const noJsPage = await noJs.newPage();
        await goto(noJsPage, '/contact');
        await visible(noJsPage);
      } finally { await noJs.close(); }
    });
    await check('mobile menu excludes closed links and Escape restores focus', async () => {
      const mobile = await contextFor({ isMobile: true });
      try {
        const mobilePage = await mobile.newPage();
        await goto(mobilePage);
        const toggle = mobilePage.locator('button[aria-controls="mobile-navigation"]');
        const wrapper = mobilePage.locator('.mobile-menu');
        const menu = mobilePage.locator('#mobile-navigation');
        assert.equal(await menu.count(), 1);
        assert.equal(await wrapper.getAttribute('aria-hidden'), 'true');
        assert.ok(await wrapper.evaluate(element => element.inert));
        await toggle.focus();
        await mobilePage.keyboard.press('Tab');
        assert.ok(await mobilePage.evaluate(() => !document.querySelector('.mobile-menu').contains(document.activeElement)));
        await toggle.click();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        assert.ok(!(await wrapper.evaluate(element => element.inert)));
        await menu.getByRole('link').first().focus();
        await mobilePage.keyboard.press('Escape');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        assert.ok(await toggle.evaluate(element => element === document.activeElement));
        assert.ok(await wrapper.evaluate(element => element.inert));
      } finally { await mobile.close(); }
    });
    assert.deepEqual(report.blockedRequests, []);
    assert.deepEqual(report.browserErrors, []);
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
