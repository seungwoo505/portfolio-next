// 합성 fixture 전용. 격리 preview는 별도로 시작하며 이 스크립트는 서버를 시작하지 않는다.
// node scripts/isolated-reading-design.js --phase before|after
// 두 phase의 preview/API 모두 ISOLATED_CONTENT_BENCHMARK=1을 사용한다.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { gzipSync } = require('node:zlib');
const { assertLocalDestination, installNetworkGuard } = require('./isolated-network');
installNetworkGuard();

const argument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  assert.ok(index < 0 || process.argv[index + 1], `${name} requires a value`);
  return index < 0 ? fallback : process.argv[index + 1];
};
const phase = argument('--phase', process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'before');
assert.ok(['before', 'after'].includes(phase), 'Use --phase before|after');
const baseUrl = process.env.ISOLATED_APP_URL || 'http://127.0.0.1:4318';
const apiUrl = process.env.ISOLATED_API_URL || 'http://127.0.0.1:4319';
assertLocalDestination(baseUrl);
assertLocalDestination(apiUrl);
const origins = new Set([new URL(baseUrl).origin, new URL(apiUrl).origin]);
const root = path.resolve(process.env.ISOLATED_READING_ROOT || path.join(__dirname, '../.verification/reading-design-20261113'));
const output = path.join(root, phase);
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const artifactDirectory = path.join(output, 'snapshots', runId);
fs.mkdirSync(artifactDirectory, { recursive: true });
const reportFile = path.join(output, 'reading.json');
// 원본 HTML/API/PNG와 이전 report는 재실행해도 덮어쓰지 않는다.
if (fs.existsSync(reportFile)) fs.copyFileSync(reportFile, path.join(output, `reading.previous-${runId}.json`), fs.constants.COPYFILE_EXCL);
const cases = [false, true].flatMap(mobile => ['light', 'dark'].map(theme => ({ mobile, theme, name: `${mobile ? 'mobile' : 'desktop'}-${theme}` })));
const modes = [
  { name: 'projects', list: '프로젝트 목록', search: '프로젝트 검색', sort: '프로젝트 정렬 방식 선택', tags: '기술 스택 필터', all: '[data-all-projects]', body: '.project-block-content', detail: '/projects/fixture-project-1', query: 'ㅍㄹㅈㅌ 1' },
  { name: 'blog', list: '블로그 목록', search: '블로그 포스트 검색', sort: '블로그 정렬 방식 선택', tags: '블로그 태그 필터', all: '[data-all-posts]', body: '.blog-post-block-content', detail: '/blog/fixture-post-1', query: 'ㄱㅂ ㄱㄹ 1' },
];
const report = { phase, startedAt: new Date().toISOString(), baseUrl, apiUrl, nodeVersion: process.version, fixture: true, artifactDirectory: path.relative(root, artifactDirectory), fixtureRequirement: 'Identical ISOLATED_CONTENT_BENCHMARK=1 synthetic content in both phases; no production-speed claim.', home: null, lists: [], details: [], checks: [], suppressedViewWrites: [], blockedRequests: [], browserErrors: [] };
let browser;
const sha256 = data => createHash('sha256').update(data).digest('hex');
const bytes = data => ({ rawBytes: Buffer.byteLength(data), gzipBytes: gzipSync(data).length, sha256: sha256(data) });
const save = () => fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
const gate = (name, condition, evidence) => {
  report.checks.push({ name, passed: Boolean(condition), ...(evidence === undefined ? {} : { evidence }) });
  assert.ok(condition, name);
};
const screenshot = async (page, name) => {
  const filename = `${name}.png`;
  await page.screenshot({ path: path.join(artifactDirectory, filename), animations: 'disabled' });
  return path.relative(output, path.join(artifactDirectory, filename));
};

function extractHomeProps(flight) {
  // Flight의 T행은 줄바꿈 대신 UTF-8 byte length로 끝난다. 긴 본문 뒤에
  // 곧바로 다음 JSON행이 올 수 있어 단순 split('\n')은 컴포넌트 행을 잃는다.
  const stream = Buffer.from(flight, 'utf8');
  const records = new Map();
  let cursor = 0;
  while (cursor < stream.length) {
    if (stream[cursor] === 10 || stream[cursor] === 13) { cursor++; continue; }
    const header = stream.subarray(cursor, cursor + 32).toString('ascii').match(/^([0-9a-f]*):/i);
    assert.ok(header, `Unsupported Flight row boundary at byte ${cursor}`);
    const id = header[1].toLowerCase();
    cursor += header[0].length;
    if (stream[cursor] === 84) { // T<hex byte length>,<unescaped UTF-8 text>
      const comma = stream.indexOf(44, cursor + 1);
      const lengthText = stream.subarray(cursor + 1, comma).toString('ascii');
      assert.ok(comma >= 0 && /^[0-9a-f]+$/i.test(lengthText), `Invalid Flight text row ${id}`);
      const length = Number.parseInt(lengthText, 16);
      const end = comma + 1 + length;
      assert.ok(end <= stream.length, `Truncated Flight text row ${id}`);
      records.set(id, stream.subarray(comma + 1, end).toString('utf8'));
      cursor = end;
      continue;
    }
    const newline = stream.indexOf(10, cursor);
    const end = newline < 0 ? stream.length : newline;
    const payload = stream.subarray(cursor, end).toString('utf8');
    try { records.set(id, JSON.parse(payload)); } catch { /* Module/hint rows have a non-JSON tag. */ }
    cursor = end + 1;
  }
  const resolving = new Set();
  const resolved = new Map();
  const resolve = value => {
    if (typeof value === 'string') {
      if (value.startsWith('$$')) return value.slice(1);
      const reference = value.match(/^\$([0-9a-f]+)$/i);
      if (!reference || !records.has(reference[1].toLowerCase())) return value;
      const id = reference[1].toLowerCase();
      if (resolved.has(id)) return resolved.get(id);
      if (resolving.has(id)) return value;
      resolving.add(id);
      const result = resolve(records.get(id));
      resolving.delete(id);
      resolved.set(id, result);
      return result;
    }
    if (Array.isArray(value)) return value.map(resolve);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, resolve(child)]));
    return value;
  };
  let found = null;
  const inspect = value => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value.blogPosts) && Array.isArray(value.projects)) found = value;
    for (const child of Object.values(value)) inspect(child);
  };
  for (const value of records.values()) inspect(resolve(value));
  return found;
}

async function localResponse(url) {
  assertLocalDestination(url);
  assert.ok(origins.has(new URL(url).origin), `Unapproved local origin: ${url}`);
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30000), headers: { 'Accept-Encoding': 'identity' } });
  assert.ok(response.ok, `Local fixture response ${response.status}: ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  return { body, status: response.status, contentType: response.headers.get('content-type'), contentEncoding: response.headers.get('content-encoding'), ...bytes(body) };
}

async function measureHome() {
  const health = await localResponse(`${apiUrl}/health`);
  gate('Synthetic API health marker', JSON.parse(health.body.toString()).data?.fixture === true);
  const sources = [
    { name: 'posts', pathname: '/public/posts?limit=2&featured=true' },
    { name: 'projects', pathname: '/public/projects?limit=2&featured=true' },
    { name: 'skills', pathname: '/public/skills/featured' },
    { name: 'profile', pathname: '/public/profile' },
  ];
  const sourceBodies = [];
  for (const source of sources) {
    const response = await localResponse(apiUrl + source.pathname);
    const filename = `home-source-${source.name}.json`;
    fs.writeFileSync(path.join(artifactDirectory, filename), response.body);
    const parsed = JSON.parse(response.body.toString('utf8'));
    gate(`Home source ${source.name} success`, parsed.success === true);
    const fields = (Array.isArray(parsed.data) ? parsed.data : [parsed.data]).map(item => Object.fromEntries(['content', 'content_html', 'content_text', 'detailed_description'].filter(key => typeof item?.[key] === 'string').map(key => [key, Buffer.byteLength(item[key])])));
    sourceBodies.push({ ...source, ...bytes(response.body), status: response.status, fields, snapshot: path.relative(output, path.join(artifactDirectory, filename)) });
  }
  const response = await localResponse(baseUrl + '/');
  const html = response.body.toString('utf8');
  fs.writeFileSync(path.join(artifactDirectory, 'home.html'), response.body);
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
  const flightScripts = scripts.filter(script => script.includes('__next_f'));
  const decodedParts = [];
  for (const script of flightScripts) {
    const match = script.match(/self\.__next_f\.push\((\[[\s\S]*\])\);?$/);
    if (match) {
      const payload = JSON.parse(match[1]);
      if (typeof payload[1] === 'string') decodedParts.push(payload[1]);
    }
  }
  const scriptText = flightScripts.join('\n');
  const decodedText = decodedParts.join('');
  fs.writeFileSync(path.join(artifactDirectory, 'home-flight-scripts.txt'), scriptText);
  fs.writeFileSync(path.join(artifactDirectory, 'home-flight-decoded.txt'), decodedText);
  const homeProps = extractHomeProps(decodedText);
  gate('Home component props boundary detected in RSC', Boolean(homeProps));
  const serializedProps = JSON.stringify(homeProps);
  fs.writeFileSync(path.join(artifactDirectory, 'home-component-props.json'), JSON.stringify(homeProps, null, 2));
  report.home = { html: { ...bytes(response.body), status: response.status, contentEncoding: response.contentEncoding, snapshot: path.relative(output, path.join(artifactDirectory, 'home.html')) }, allInlineScriptBytes: scripts.reduce((sum, script) => sum + Buffer.byteLength(script), 0), flight: { scriptCount: flightScripts.length, ...bytes(scriptText), decoded: bytes(decodedText), homeProps: { ...bytes(serializedProps), keys: Object.keys(homeProps), fieldOccurrences: Object.fromEntries(['content', 'content_html', 'content_text', 'detailed_description'].map(field => [field, (serializedProps.match(new RegExp(`"${field}"\\s*:`, 'g')) || []).length])), snapshot: path.relative(output, path.join(artifactDirectory, 'home-component-props.json')) }, scriptSnapshot: path.relative(output, path.join(artifactDirectory, 'home-flight-scripts.txt')), decodedSnapshot: path.relative(output, path.join(artifactDirectory, 'home-flight-decoded.txt')) }, sources: sourceBodies };
  gate('Home RSC flight detected', flightScripts.length > 0 && decodedParts.length > 0);
  gate('Long source post fixture supplied', sourceBodies.find(source => source.name === 'posts').fields.some(fields => (fields.content_html || fields.content || 0) >= 1200));
  if (phase === 'after') gate('Home DTO excludes full content fields', Object.values(report.home.flight.homeProps.fieldOccurrences).every(count => count === 0), report.home.flight.homeProps.fieldOccurrences);
  save();
}

async function contextFor(options) {
  const context = await browser.newContext({ viewport: options.mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: options.mobile, deviceScaleFactor: 1, colorScheme: options.theme, reducedMotion: 'reduce', serviceWorkers: 'block' });
  await context.addInitScript(theme => { try { localStorage.setItem('theme', theme); } catch {} }, options.theme);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(apiUrl).origin && route.request().method() === 'POST' && /^\/public\/(projects|posts)\/[^/]+\/view$/.test(url.pathname)) {
      report.suppressedViewWrites.push(url.href);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { success: true } }) });
    }
    if (['data:', 'blob:'].includes(url.protocol) || origins.has(url.origin)) return route.continue();
    report.blockedRequests.push(url.href);
    return route.abort('blockedbyclient');
  });
  // 브라우저 HTTP, WebSocket 및 백그라운드 통신을 각 층에서 차단한다.
  assert.equal(typeof context.routeWebSocket, 'function', 'Playwright WebSocket routing is required');
  await context.routeWebSocket('**/*', socket => {
    const url = new URL(socket.url());
    url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    if (origins.has(url.origin)) socket.connectToServer();
    else { report.blockedRequests.push(socket.url()); socket.close(); }
  });
  context.on('page', page => page.on('pageerror', error => report.browserErrors.push(error.message)));
  return context;
}

async function navigate(page, pathname, options) {
  const response = await page.goto(baseUrl + pathname, { waitUntil: 'networkidle', timeout: 60000 });
  assert.ok(response?.ok(), `${pathname} HTTP ${response?.status()}`);
  await page.locator('main').first().waitFor({ state: 'visible' });
  await page.waitForFunction(theme => document.documentElement.classList.contains('dark') === (theme === 'dark'), options.theme);
  await page.evaluate(() => document.fonts.ready);
}

async function waitForList(page, mode) {
  await page.waitForFunction(label => document.querySelector(`[aria-label="${label}"]`)?.getAttribute('aria-busy') === 'false', mode.list);
}

async function listState(page, mode) {
  return page.evaluate(({ list, search, sort, tags }) => {
    const section = document.querySelector(`[aria-label="${list}"]`);
    const first = section.querySelector('article');
    const visible = element => Boolean(element && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
    const toggler = document.querySelector('[data-list-filter-toggle]');
    const panel = document.querySelector('[data-list-filter-panel]');
    const rect = first?.getBoundingClientRect();
    return { titles: [...section.querySelectorAll('article h3')].map(heading => heading.textContent.trim()), countText: section.querySelector('h2')?.textContent.replace(/\s+/g, ' ').trim(), currentPage: section.querySelector('[aria-current="page"]')?.textContent.trim() || '1', search: document.querySelector(`[aria-label="${search}"]`)?.value, sort: document.querySelector(`[aria-label="${sort}"]`)?.value, selectedTags: [...document.querySelectorAll(`[aria-label="${tags}"] button[aria-pressed="true"]`)].map(button => button.textContent.trim()), searchVisible: visible(document.querySelector(`[aria-label="${search}"]`)), sortVisible: visible(document.querySelector(`[aria-label="${sort}"]`)), tagsVisible: visible(document.querySelector(`[aria-label="${tags}"]`)), toggleVisible: visible(toggler), toggleText: toggler?.textContent.replace(/\s+/g, ' ').trim() || null, expanded: toggler?.getAttribute('aria-expanded') ?? toggler?.closest('details')?.open ?? null, panelVisible: visible(panel), firstCardTop: rect?.top ?? null, firstCardDocumentTop: rect ? rect.top + scrollY : null, viewport: { width: innerWidth, height: innerHeight }, horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
  }, mode);
}

const functionalState = state => ({ titles: state.titles, countText: state.countText, currentPage: state.currentPage, search: state.search, sort: state.sort, selectedTags: state.selectedTags });

async function exerciseList(options, mode) {
  const context = await contextFor(options);
  const record = { case: options.name, pathname: `/${mode.name}`, states: {}, screenshots: {} };
  report.lists.push(record);
  try {
    const page = await context.newPage();
    await navigate(page, record.pathname, options);
    await waitForList(page, mode);
    const list = page.getByRole('region', { name: mode.list, exact: true });
    const search = page.getByRole('searchbox', { name: mode.search, exact: true });
    const sort = page.getByRole('combobox', { name: mode.sort, exact: true });
    const toggle = page.locator('[data-list-filter-toggle]');
    const tagGroup = page.locator(`[aria-label="${mode.tags}"]`);
    await page.waitForFunction(label => document.querySelectorAll(`[aria-label="${label}"] button`).length > 1, mode.tags);
    record.initial = await listState(page, mode);
    record.states.initial = functionalState(record.initial);
    record.screenshots.initial = await screenshot(page, `${options.name}-${mode.name}-initial`);
    gate(`${options.name} ${mode.name} search always visible`, record.initial.searchVisible);
    gate(`${options.name} ${mode.name} six initial cards`, record.initial.titles.length === 6);
    gate(`${options.name} ${mode.name} no horizontal overflow`, !record.initial.horizontalOverflow);
    if (phase === 'after' && options.mobile) {
      gate(`${options.name} ${mode.name} collapsed filters`, record.initial.toggleVisible && !record.initial.sortVisible && !record.initial.tagsVisible);
      await toggle.click();
      await sort.waitFor({ state: 'visible' });
      record.open = await listState(page, mode);
      gate(`${options.name} ${mode.name} opened tags`, record.open.tagsVisible);
      record.screenshots.open = await screenshot(page, `${options.name}-${mode.name}-open`);
    } else gate(`${options.name} ${mode.name} full filters visible`, record.initial.sortVisible && record.initial.tagsVisible);
    await list.getByRole('button', { name: '2페이지', exact: true }).click();
    await page.waitForFunction(label => document.querySelector(`[aria-label="${label}"] [aria-label="2페이지"]`)?.getAttribute('aria-current') === 'page', mode.list);
    record.states.page2 = functionalState(await listState(page, mode));
    gate(`${options.name} ${mode.name} pagination changes cards`, JSON.stringify(record.states.page2.titles) !== JSON.stringify(record.states.initial.titles));
    await search.fill(mode.query);
    await page.waitForFunction(label => document.querySelector(`[aria-label="${label}"]`)?.value === document.activeElement?.value, mode.search);
    record.states.initialSearch = functionalState(await listState(page, mode));
    gate(`${options.name} ${mode.name} initials search and page reset`, record.states.initialSearch.titles.length === 6 && record.states.initialSearch.currentPage === '1' && record.states.initialSearch.titles.every(title => /1(?:[0-4])?$/.test(title)));
    await search.fill('절대없는검증검색어');
    await list.getByRole('heading', { name: '검색 결과가 없습니다.', exact: true }).waitFor({ state: 'visible' });
    record.states.noResults = functionalState(await listState(page, mode));
    gate(`${options.name} ${mode.name} no-results search`, record.states.noResults.titles.length === 0);
    await search.fill('');
    await list.locator('article').first().waitFor({ state: 'visible' });
    // 로컬 검증은 두 목록 모두 일곱 항목에만 붙은 동일한 합성 태그다.
    await tagGroup.getByRole('button', { name: /^로컬 검증(?:\s*\(\d+\))?$/ }).click();
    await tagGroup.locator('button[aria-pressed="true"]').filter({ hasText: '로컬 검증' }).waitFor();
    record.states.tagSelected = functionalState(await listState(page, mode));
    gate(`${options.name} ${mode.name} tag selection applies`, /7개/.test(record.states.tagSelected.countText) && record.states.tagSelected.selectedTags.length === 1);
    await sort.selectOption('view_count');
    record.states.sorted = functionalState(await listState(page, mode));
    gate(`${options.name} ${mode.name} view-count sort applies`, record.states.sorted.sort === 'view_count' && /13$/.test(record.states.sorted.titles[0]));
    await list.getByRole('button', { name: '2페이지', exact: true }).click();
    record.states.filteredPage2 = functionalState(await listState(page, mode));
    gate(`${options.name} ${mode.name} filtered pagination`, record.states.filteredPage2.currentPage === '2' && record.states.filteredPage2.titles.length === 1);
    await list.getByRole('button', { name: '1페이지', exact: true }).click();
    if (phase === 'after' && options.mobile) {
      await toggle.click();
      await sort.waitFor({ state: 'hidden' });
      record.closedSelected = await listState(page, mode);
      gate(`${options.name} ${mode.name} collapsed selected count`, /1/.test(record.closedSelected.toggleText || '') && record.closedSelected.selectedTags.length === 1);
      record.screenshots.closedSelected = await screenshot(page, `${options.name}-${mode.name}-closed-selected`);
      await toggle.focus();
      const tabStops = [];
      for (let index = 0; index < 5; index++) {
        await page.keyboard.press('Tab');
        tabStops.push(await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim().slice(0, 80), inClosedPanel: Boolean(document.activeElement?.closest('[data-list-filter-panel]')) })));
      }
      record.closedTabStops = tabStops;
      gate(`${options.name} ${mode.name} closed panel excluded from Tab`, tabStops.every(stop => !stop.inClosedPanel));
      await toggle.click();
      await sort.waitFor({ state: 'visible' });
      await sort.focus();
      await page.keyboard.press('Escape');
      await sort.waitFor({ state: 'hidden' });
      record.escape = { state: await listState(page, mode), focusReturned: await toggle.evaluate(element => element === document.activeElement) };
      gate(`${options.name} ${mode.name} Escape closes and restores focus`, !record.escape.state.panelVisible && record.escape.focusReturned);
      await page.setViewportSize({ width: 768, height: 1000 });
      await sort.waitFor({ state: 'visible' });
      record.expandedViewport = await listState(page, mode);
      gate(`${options.name} ${mode.name} 768px exposes existing filters`, record.expandedViewport.sortVisible && record.expandedViewport.tagsVisible && !record.expandedViewport.toggleVisible);
      gate(`${options.name} ${mode.name} resize preserves selection and sort`, record.expandedViewport.selectedTags.length === 1 && record.expandedViewport.sort === 'view_count');
      await page.setViewportSize({ width: 390, height: 844 });
      // setViewportSize 완료 직후에는 이전 768px의 media listener 상태가 남을 수 있다.
      // 모바일 viewport, CSS media query, React의 inert 갱신까지 관측한 뒤 연다.
      await page.waitForFunction(() => innerWidth === 390
        && !matchMedia('(min-width: 768px)').matches
        && document.querySelector('[data-list-filter-panel]')?.inert === true);
      await sort.waitFor({ state: 'hidden' });
      await toggle.waitFor({ state: 'visible' });
      record.returnedMobileClosed = await listState(page, mode);
      await toggle.click();
      await page.waitForFunction(() => innerWidth === 390
        && !matchMedia('(min-width: 768px)').matches
        && document.querySelector('[data-list-filter-panel]')?.inert === false);
      await sort.waitFor({ state: 'visible' });
      await tagGroup.waitFor({ state: 'visible' });
      await page.locator(mode.all).waitFor({ state: 'visible' });
      record.returnedMobileOpen = await listState(page, mode);
      gate(`${options.name} ${mode.name} mobile resize return reopens usable filters`, record.returnedMobileOpen.sortVisible && record.returnedMobileOpen.tagsVisible && record.returnedMobileOpen.selectedTags.length === 1 && record.returnedMobileOpen.sort === 'view_count');
    }
    await page.locator(mode.all).click();
    record.states.cleared = functionalState(await listState(page, mode));
    gate(`${options.name} ${mode.name} all filter restores 14 items`, /14개/.test(record.states.cleared.countText));
    console.log(`LIST ${phase} ${options.name} ${mode.name}: first card ${record.initial.firstCardTop}px`);
  } finally { save(); await context.close(); }
}

async function bodySnapshot(page, selector) {
  return page.locator(selector).first().evaluate(element => ({ text: element.textContent.replace(/\s+/g, ' ').trim(), headings: [...element.querySelectorAll('h2,h3')].filter(heading => heading.textContent.trim()).map(heading => ({ level: heading.tagName, text: heading.textContent.trim() })), images: [...element.querySelectorAll('img')].map(image => ({ src: image.getAttribute('src'), alt: image.getAttribute('alt'), width: image.getAttribute('width'), height: image.getAttribute('height') })), links: [...element.querySelectorAll('a')].map(anchor => ({ href: anchor.getAttribute('href'), text: anchor.textContent.trim(), target: anchor.getAttribute('target'), rel: anchor.getAttribute('rel') })), tables: [...element.querySelectorAll('table')].map(table => [...table.rows].map(row => [...row.cells].map(cell => ({ tag: cell.tagName, text: cell.textContent.replace(/\s+/g, ' ').trim(), colspan: cell.colSpan, rowspan: cell.rowSpan })))), structure: Object.fromEntries(['p', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'figure', 'figcaption', 'table', 'tr', 'th', 'td'].map(tag => [tag, element.querySelectorAll(tag).length])) }));
}

async function exerciseDetail(options, mode) {
  const context = await contextFor(options);
  const record = { case: options.name, pathname: mode.detail, screenshots: {}, links: [] };
  report.details.push(record);
  try {
    const page = await context.newPage();
    await navigate(page, mode.detail, options);
    await page.locator(`${mode.body} h2,${mode.body} h3`).first().waitFor({ state: 'visible' });
    record.body = await bodySnapshot(page, mode.body);
    record.duplicateDocumentIds = await page.evaluate(() => {
      const counts = new Map();
      for (const element of document.querySelectorAll('[id]')) counts.set(element.id, (counts.get(element.id) || 0) + 1);
      return [...counts].filter(([id, count]) => id && count > 1).map(([id, count]) => ({ id, count }));
    });
    gate(`${options.name} ${mode.name} no duplicate document ids`, record.duplicateDocumentIds.length === 0, record.duplicateDocumentIds);
    gate(`${options.name} ${mode.name} long fixture eligible for TOC`, record.body.text.length >= 1200 && record.body.headings.length >= 3, { characters: record.body.text.length, headings: record.body.headings.length });
    const toc = page.locator('[data-article-contents]');
    record.tocCount = await toc.count();
    if (phase === 'before') {
      gate(`${options.name} ${mode.name} baseline has no TOC`, record.tocCount === 0);
      await page.locator(mode.body).first().scrollIntoViewIfNeeded();
      record.screenshots.body = await screenshot(page, `${options.name}-${mode.name}-detail-baseline`);
      return;
    }
    await toc.waitFor({ state: 'visible' });
    const toggle = toc.locator('[data-article-contents-toggle]');
    const links = toc.locator('a[href^="#"]');
    record.initialOpen = await toc.evaluate(element => element instanceof HTMLDetailsElement ? element.open : element.querySelector('[aria-expanded]')?.getAttribute('aria-expanded') === 'true');
    record.linkCount = await links.count();
    gate(`${options.name} ${mode.name} responsive TOC default`, record.initialOpen === !options.mobile);
    gate(`${options.name} ${mode.name} one TOC link per heading`, record.linkCount === record.body.headings.length);
    await toc.scrollIntoViewIfNeeded();
    record.screenshots.initial = await screenshot(page, `${options.name}-${mode.name}-toc-initial`);
    if (options.mobile) {
      gate(`${options.name} ${mode.name} mobile TOC links hidden`, !await links.first().isVisible());
      await toggle.click();
    }
    await links.first().waitFor({ state: 'visible' });
    record.screenshots.open = await screenshot(page, `${options.name}-${mode.name}-toc-open`);
    record.ids = await page.evaluate(selector => {
      const headings = [...document.querySelectorAll(`${selector} h2,${selector} h3`)].filter(heading => heading.textContent.trim());
      const allIds = [...document.querySelectorAll('[id]')].map(element => element.id);
      return headings.map(heading => ({ id: heading.id, text: heading.textContent.trim(), occurrences: allIds.filter(id => id === heading.id).length, tabIndex: heading.tabIndex }));
    }, mode.body);
    gate(`${options.name} ${mode.name} unique nonempty heading ids`, record.ids.every(item => item.id && item.occurrences === 1));
    gate(`${options.name} ${mode.name} focusable TOC targets`, record.ids.every(item => item.tabIndex === -1));
    record.duplicateHeadingTexts = record.body.headings.map(item => item.text).filter((text, index, texts) => texts.indexOf(text) !== index);
    record.koreanHeadingCount = record.body.headings.filter(item => /[가-힣]/.test(item.text)).length;
    for (let index = 0; index < record.linkCount; index++) {
      const link = links.nth(index);
      const href = await link.getAttribute('href');
      const id = decodeURIComponent(href.slice(1));
      const validity = await page.evaluate(({ selector, id }) => {
        const target = document.getElementById(id);
        return { exists: Boolean(target), inBody: Boolean(target?.closest(selector)), heading: Boolean(target?.matches('h2,h3')), text: target?.textContent.trim() };
      }, { selector: mode.body, id });
      gate(`${options.name} ${mode.name} TOC link ${index + 1} resolves`, validity.exists && validity.inBody && validity.heading);
      await link.click();
      await page.waitForFunction(id => decodeURIComponent(location.hash.slice(1)) === id && document.activeElement === document.getElementById(id), id);
      await page.waitForFunction(id => {
        const target = document.getElementById(id);
        const header = document.querySelector('body > header, body header.sticky, header.sticky');
        const boundary = header && ['sticky', 'fixed'].includes(getComputedStyle(header).position) ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
        const rect = target.getBoundingClientRect();
        return rect.top >= boundary - 1 && rect.bottom <= innerHeight;
      }, id);
      const result = await page.evaluate(id => {
        const target = document.getElementById(id);
        const header = document.querySelector('body > header, body header.sticky, header.sticky');
        return { id, hash: location.hash, text: target.textContent.trim(), focused: target === document.activeElement, headingTop: target.getBoundingClientRect().top, headingBottom: target.getBoundingClientRect().bottom, headerBottom: header?.getBoundingClientRect().bottom || 0, scrollMarginTop: getComputedStyle(target).scrollMarginTop };
      }, id);
      record.links.push({ href, ...validity, ...result });
    }
    gate(`${options.name} ${mode.name} TOC navigation preserves body`, JSON.stringify(await bodySnapshot(page, mode.body)) === JSON.stringify(record.body));
    console.log(`DETAIL ${phase} ${options.name} ${mode.name}: ${record.linkCount} TOC links`);
  } finally { save(); await context.close(); }
}

function compareBaseline() {
  if (phase !== 'after') return;
  const baselineFile = path.join(root, 'before', 'reading.json');
  gate('Baseline report exists', fs.existsSync(baselineFile));
  const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  gate('Baseline run passed', baseline.passed === true);
  report.comparison = { baseline: path.relative(root, baselineFile), home: { htmlRawBefore: baseline.home.html.rawBytes, htmlRawAfter: report.home.html.rawBytes, htmlGzipBefore: baseline.home.html.gzipBytes, htmlGzipAfter: report.home.html.gzipBytes, flightRawBefore: baseline.home.flight.rawBytes, flightRawAfter: report.home.flight.rawBytes, flightGzipBefore: baseline.home.flight.gzipBytes, flightGzipAfter: report.home.flight.gzipBytes, sources: report.home.sources.map(source => { const previous = baseline.home.sources.find(item => item.name === source.name); return { name: source.name, beforeRawBytes: previous?.rawBytes, afterRawBytes: source.rawBytes, beforeGzipBytes: previous?.gzipBytes, afterGzipBytes: source.gzipBytes, sameSource: previous?.sha256 === source.sha256 }; }) }, lists: [], details: [] };
  gate('Identical home source API responses', report.comparison.home.sources.every(source => source.sameSource), report.comparison.home.sources);
  gate('Home RSC raw bytes reduced', report.home.flight.rawBytes < baseline.home.flight.rawBytes);
  gate('Home HTML raw bytes reduced', report.home.html.rawBytes < baseline.home.html.rawBytes);
  for (const current of report.lists) {
    const previous = baseline.lists.find(item => item.case === current.case && item.pathname === current.pathname);
    gate(`${current.case} ${current.pathname} baseline list exists`, Boolean(previous));
    const statesEqual = JSON.stringify(previous.states) === JSON.stringify(current.states);
    const topDifference = current.initial.firstCardDocumentTop - previous.initial.firstCardDocumentTop;
    const comparison = { case: current.case, pathname: current.pathname, statesEqual, firstCardTopBefore: previous.initial.firstCardTop, firstCardTopAfter: current.initial.firstCardTop, firstCardDocumentTopDifference: topDifference };
    report.comparison.lists.push(comparison);
    gate(`${current.case} ${current.pathname} filter/search/sort/pagination behavior preserved`, statesEqual);
    gate(`${current.case} ${current.pathname} ${current.case.startsWith('mobile') ? 'list moves upward' : 'desktop list position preserved'}`, current.case.startsWith('mobile') ? topDifference < 0 : Math.abs(topDifference) <= 1, comparison);
  }
  for (const current of report.details) {
    const previous = baseline.details.find(item => item.case === current.case && item.pathname === current.pathname);
    const bodyPreserved = Boolean(previous) && JSON.stringify(previous.body) === JSON.stringify(current.body);
    report.comparison.details.push({ case: current.case, pathname: current.pathname, bodyPreserved });
    gate(`${current.case} ${current.pathname} full body/images/links/tables preserved`, bodyPreserved);
  }
}

(async () => {
  try {
    await measureHome();
    const { chromium } = require(process.env.ISOLATED_PLAYWRIGHT_PATH || 'C:/Users/QT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
    browser = await chromium.launch({ channel: process.env.ISOLATED_BROWSER_CHANNEL || 'chrome', headless: true, args: ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-quic', '--no-first-run', '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;localhost;[::1]'] });
    for (const options of cases) for (const mode of modes) await exerciseList(options, mode);
    for (const options of cases) for (const mode of modes) await exerciseDetail(options, mode);
    compareBaseline();
    gate('No external HTTP or WebSocket request', report.blockedRequests.length === 0, report.blockedRequests);
    gate('No unhandled browser error', report.browserErrors.length === 0, report.browserErrors);
    report.passed = true;
  } catch (error) {
    report.passed = false;
    report.error = error.stack;
    console.error(error);
    process.exitCode = 1;
  } finally {
    report.finishedAt = new Date().toISOString();
    save();
    await browser?.close();
    console.log(`Report: ${reportFile}`);
  }
})();
