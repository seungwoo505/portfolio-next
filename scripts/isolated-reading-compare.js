// 저장된 합성 fixture 증거만 읽는다. HTTP 요청, 서버/브라우저 실행은 하지 않는다.
// node scripts/isolated-reading-compare.js
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { gzipSync } = require('node:zlib');
const { installNetworkGuard } = require('./isolated-network');
installNetworkGuard();

const root = path.resolve(process.env.ISOLATED_READING_ROOT || process.env.ISOLATED_PERFORMANCE_ROOT || path.join(__dirname, '../.verification/reading-design-20261113'));
const outputFile = path.join(root, 'reading-comparison.json');
const cases = ['desktop-light', 'desktop-dark', 'mobile-light', 'mobile-dark'];
const paths = ['/', '/projects', '/projects/fixture-project-1', '/blog', '/blog/fixture-post-1', '/about', '/contact', '/settings'];
const listPaths = ['/projects', '/blog'];
const detailPaths = ['/projects/fixture-project-1', '/blog/fixture-post-1'];
const keyOf = page => `${page.case} ${page.pathname}`;
const expectedKeys = cases.flatMap(name => paths.map(pathname => `${name} ${pathname}`));
const listKeys = cases.flatMap(name => listPaths.map(pathname => `${name} ${pathname}`));
const detailKeys = cases.flatMap(name => detailPaths.map(pathname => `${name} ${pathname}`));
const intended = page => detailPaths.includes(page.pathname) || (page.case.startsWith('mobile-') && listPaths.includes(page.pathname));
const desktopList = page => ['desktop-light', 'desktop-dark'].includes(page.case) && listPaths.includes(page.pathname);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const normalize = value => typeof value === 'string' ? value.replace(/조회\s*\d+/g, '<count>') : value;
const output = { generatedAt: new Date().toISOString(), root, method: { offlineOnly: true, originalReportsReadOnly: true, textNormalization: 'Only /조회\\s*\\d+/g in text/bodyText is normalized.', rectTolerancePx: 0.5, hiddenDesignRows: 'Only main p/main button entries with BOTH rect.width=0 and rect.height=0 are excluded in both phases; those two selectors are reindexed separately.', desktopListTruncatedTextException: { cases: cases.filter(name => name.startsWith('desktop-')).flatMap(name => listPaths.map(pathname => `${name} ${pathname}`)), excludedFields: ['design[selector=body].text', 'design[selector=main].text'], reason: 'The 180-character textContent diagnostic includes the new desktop-hidden mobile filter summary and truncates a different tail. Removing summary text cannot reconstruct the lost tail.', replacementGate: 'Both phases must have string bodyText and their complete visible bodyText must match after view-count normalization. Original truncated diagnostics are retained separately.', strictFieldsRetained: 'All other selector text, every design style/rect/index, full bodyText, viewport, document and image evidence remain strict.' }, imageGate: 'All 32 cases: same currentSrc and decoded source, completed nonempty image, actual saved HTTP 200 image response (inline data/blob uses decoded-image evidence). Image rects are also identical within 0.5px in the unchanged 20 cases.', intentionalChanges: '4 mobile project/blog list cases and 8 long-detail cases are checked by reading behavior/body/TOC evidence; the other 20 cases require equal design (with the explicit truncated-text exception), document, full visible bodyText and image rectangles.', syntheticFixture: 'Local synthetic data only; gzip is recomputed from saved bytes, not a production transfer-speed estimate.' }, inputs: [], missingInputs: [], checks: [], pages: [], lists: [], details: [], homePayload: null, hiddenDesignExclusions: [], diagnostics: { desktopListTruncatedText: [] }, totalDifferenceCount: 0, differences: [], hardGate: {} };
const checks = (name, passed, evidence) => {
  output.checks.push({ name, passed: Boolean(passed), ...(evidence === undefined ? {} : { evidence }) });
  return Boolean(passed);
};
const compact = value => value === undefined ? '<missing>' : typeof value === 'string' && value.length > 500 ? { length: value.length, sha256: sha256(value), preview: value.slice(0, 500) } : value;

function differences(before, after, key = '', found = []) {
  if (typeof before === 'number' && typeof after === 'number' && /(?:^|\.)rect\./.test(key) && Math.abs(before - after) <= 0.5) return found;
  if (typeof before === 'string' && typeof after === 'string' && /(?:^|\.)(?:text|bodyText)$/.test(key)) { before = normalize(before); after = normalize(after); }
  if (before && after && typeof before === 'object' && typeof after === 'object' && Array.isArray(before) === Array.isArray(after)) {
    for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) differences(before[name], after[name], key ? `${key}.${name}` : name, found);
  } else if (before !== after) found.push({ key, before: compact(before), after: compact(after) });
  return found;
}

function noteDifferences(scope, found) {
  output.totalDifferenceCount += found.length;
  for (const item of found) if (output.differences.length < 20) output.differences.push({ ...scope, ...item });
}

function readReport(phase, filename) {
  const file = path.join(root, phase, filename);
  if (!fs.existsSync(file)) { output.missingInputs.push(path.relative(root, file)); return null; }
  const bytes = fs.readFileSync(file);
  output.inputs.push({ file: path.relative(root, file), bytes: bytes.length, sha256: sha256(bytes) });
  return JSON.parse(bytes.toString('utf8'));
}

function inventory(rows, expected) {
  const map = new Map((rows || []).map(row => [keyOf(row), row]));
  return { count: rows?.length || 0, uniqueCount: map.size, missing: expected.filter(key => !map.has(key)), unexpected: [...map.keys()].filter(key => !expected.includes(key)), valid: rows?.length === expected.length && map.size === expected.length && expected.every(key => map.has(key)) };
}

function designRows(page, phase) {
  const counters = new Map();
  return (page.design || []).filter(row => {
    const ignored = ['main p', 'main button'].includes(row.selector) && row.rect?.width === 0 && row.rect?.height === 0;
    if (ignored) output.hiddenDesignExclusions.push({ phase, case: page.case, pathname: page.pathname, selector: row.selector, originalIndex: row.index, text: row.text, rect: row.rect });
    return !ignored;
  }).map(row => {
    let comparisonRow = row;
    if (['main p', 'main button'].includes(row.selector)) {
      const index = counters.get(row.selector) || 0;
      counters.set(row.selector, index + 1);
      comparisonRow = { ...row, index };
    }
    if (desktopList(page) && ['body', 'main'].includes(row.selector)) {
      output.diagnostics.desktopListTruncatedText.push({ phase, case: page.case, pathname: page.pathname, selector: row.selector, index: row.index, originalTruncatedText: row.text, reason: 'Only this truncated textContent field is omitted; complete visible bodyText is a separate mandatory gate.' });
      comparisonRow = { ...comparisonRow };
      delete comparisonRow.text;
    }
    return comparisonRow;
  });
}

function sourceOf(src, baseUrl) {
  if (!src || /^(?:data:|blob:)/.test(src)) return src;
  const url = new URL(src, baseUrl);
  return url.pathname === '/_next/image' && url.searchParams.has('url') ? new URL(url.searchParams.get('url'), baseUrl).href : url.href;
}

function imageEvidence(before, after, beforeBase, afterBase) {
  const validImage = (image, page) => {
    const inline = /^(?:data:|blob:)/.test(image.currentSrc || image.src);
    const response = (page.imageAndApiResponses || []).find(item => item.url === image.currentSrc && item.status === 200 && /^image\//i.test(item.contentType || '') && item.decodedBodyBytes > 0);
    return { valid: image.complete === true && image.naturalWidth > 0 && image.naturalHeight > 0 && (inline || Boolean(response)), status: response?.status ?? (inline ? 'inline' : 'missing'), contentType: response?.contentType || null, decodedBodyBytes: response?.decodedBodyBytes ?? null };
  };
  const images = (after.images || []).map((image, index) => {
    const previous = before.images?.[index];
    const beforeEvidence = previous ? validImage(previous, before) : { valid: false, status: 'missing' };
    const afterEvidence = validImage(image, after);
    const currentSrcEqual = Boolean(previous && previous.currentSrc === image.currentSrc);
    const sourceEqual = Boolean(previous && sourceOf(previous.currentSrc || previous.src, beforeBase) === sourceOf(image.currentSrc || image.src, afterBase));
    const altEqual = Boolean(previous && previous.alt === image.alt);
    return { index, alt: image.alt, currentSrc: image.currentSrc, currentSrcEqual, sourceEqual, altEqual, before: beforeEvidence, after: afterEvidence, passed: currentSrcEqual && sourceEqual && altEqual && beforeEvidence.valid && afterEvidence.valid };
  });
  const badResponses = ['before', 'after'].flatMap(phase => ((phase === 'before' ? before : after).imageAndApiResponses || []).filter(response => (response.type === 'image' || /\/_next\/image(?:\?|$)/.test(response.url)) && response.status !== 200).map(response => ({ phase, url: response.url, status: response.status })));
  return { countBefore: before.images?.length || 0, countAfter: after.images?.length || 0, images, badResponses, passed: (before.images?.length || 0) === images.length && images.every(image => image.passed) && badResponses.length === 0 };
}

function compareScreens(before, after) {
  output.screenInventory = { before: inventory(before.pages, expectedKeys), after: inventory(after.pages, expectedKeys) };
  checks('Exactly the same 32 public screen cases captured', output.screenInventory.before.valid && output.screenInventory.after.valid, output.screenInventory);
  const previousMap = new Map((before.pages || []).map(page => [keyOf(page), page]));
  const currentMap = new Map((after.pages || []).map(page => [keyOf(page), page]));
  for (const key of expectedKeys) {
    const previous = previousMap.get(key);
    const current = currentMap.get(key);
    if (!previous || !current) continue;
    const intentional = intended(current);
    const oldDesign = designRows(previous, 'before');
    const newDesign = designRows(current, 'after');
    const fields = ['title', 'bodyText', 'viewport', 'document'];
    const found = fields.flatMap(field => differences(previous[field], current[field], field));
    found.push(...differences(oldDesign, newDesign, 'design'));
    found.push(...differences((previous.images || []).map(image => ({ alt: image.alt, rect: image.rect })), (current.images || []).map(image => ({ alt: image.alt, rect: image.rect })), 'images'));
    const mandatory = ['title', 'viewport'].flatMap(field => differences(previous[field], current[field], field));
    const image = imageEvidence(previous, current, before.baseUrl, after.baseUrl);
    const fullVisibleBodyTextEqual = typeof previous.bodyText === 'string' && typeof current.bodyText === 'string' && normalize(previous.bodyText) === normalize(current.bodyText);
    if (desktopList(current)) checks(`${current.case} ${current.pathname} full visible bodyText unchanged`, fullVisibleBodyTextEqual);
    const page = { case: current.case, pathname: current.pathname, intentionalChange: intentional, captureDifferenceCount: found.length, unchangedVisualGatePassed: intentional ? null : found.length === 0 && (!desktopList(current) || fullVisibleBodyTextEqual), fullVisibleBodyTextEqual, scopedTruncatedTextException: desktopList(current), titleAndViewportPassed: mandatory.length === 0, image, css: { rawBefore: previous.css?.rawBytes, rawAfter: current.css?.rawBytes, gzipBefore: previous.css?.gzipBytes, gzipAfter: current.css?.gzipBytes } };
    output.pages.push(page);
    if (!intentional) noteDifferences({ scope: 'unchanged-screen', case: current.case, pathname: current.pathname }, found.map(item => ({ selector: item.key.startsWith('design.') ? newDesign[Number(item.key.split('.')[1])]?.selector ?? oldDesign[Number(item.key.split('.')[1])]?.selector : null, ...item })));
    else noteDifferences({ scope: 'intended-screen-mandatory', case: current.case, pathname: current.pathname }, mandatory);
  }
}

function snapshotBytes(phase, relative, expected, compactJson = false) {
  if (typeof relative !== 'string') return { exists: false, valid: false, reason: 'Missing snapshot path' };
  const phaseDirectory = path.join(root, phase);
  const file = path.resolve(phaseDirectory, relative);
  if (!file.startsWith(phaseDirectory + path.sep)) return { exists: false, valid: false, reason: 'Snapshot escapes phase directory' };
  if (!fs.existsSync(file)) return { exists: false, valid: false, file: path.relative(root, file) };
  const original = fs.readFileSync(file);
  const data = compactJson ? Buffer.from(JSON.stringify(JSON.parse(original.toString('utf8')))) : original;
  const actual = { rawBytes: data.length, gzipBytes: gzipSync(data).length, sha256: sha256(data) };
  return { exists: true, file: path.relative(root, file), ...actual, valid: actual.rawBytes === expected?.rawBytes && actual.gzipBytes === expected?.gzipBytes && actual.sha256 === expected?.sha256 };
}

function metric(name, before, after) {
  return { name, beforeBytes: before, afterBytes: after, savedBytes: Number.isFinite(before) && Number.isFinite(after) ? before - after : null, reductionRatio: Number.isFinite(before) && before > 0 && Number.isFinite(after) ? 1 - after / before : null, reduced: Number.isFinite(before) && Number.isFinite(after) && after < before };
}

function compareHome(before, after) {
  if (!before.home || !after.home) { checks('Both home payload records exist', false); return; }
  const a = before.home;
  const b = after.home;
  const sourceNames = ['posts', 'projects', 'skills', 'profile'];
  const sources = sourceNames.map(name => {
    const previous = a.sources?.find(source => source.name === name);
    const current = b.sources?.find(source => source.name === name);
    const oldSnapshot = snapshotBytes('before', previous?.snapshot, previous);
    const newSnapshot = snapshotBytes('after', current?.snapshot, current);
    return { name, pathnameBefore: previous?.pathname, pathnameAfter: current?.pathname, before: oldSnapshot, after: newSnapshot, equalSha256: Boolean(previous?.sha256 && previous.sha256 === current?.sha256), equalRawBytes: previous?.rawBytes === current?.rawBytes, equalGzipBytes: previous?.gzipBytes === current?.gzipBytes, passed: oldSnapshot.valid && newSnapshot.valid && previous?.sha256 === current?.sha256 && previous?.pathname === current?.pathname };
  });
  const snapshots = ['before', 'after'].flatMap(phase => {
    const home = phase === 'before' ? a : b;
    return [
      { phase, name: 'HTML', ...snapshotBytes(phase, home.html?.snapshot, home.html) },
      { phase, name: 'RSC scripts', ...snapshotBytes(phase, home.flight?.scriptSnapshot, home.flight) },
      { phase, name: 'RSC decoded', ...snapshotBytes(phase, home.flight?.decodedSnapshot, home.flight?.decoded) },
      { phase, name: 'home props', ...snapshotBytes(phase, home.flight?.homeProps?.snapshot, home.flight?.homeProps, true) },
    ];
  });
  const metrics = [
    metric('API sources raw', sources.reduce((sum, source) => sum + (source.before.rawBytes || 0), 0), sources.reduce((sum, source) => sum + (source.after.rawBytes || 0), 0)),
    metric('API sources gzip sum', sources.reduce((sum, source) => sum + (source.before.gzipBytes || 0), 0), sources.reduce((sum, source) => sum + (source.after.gzipBytes || 0), 0)),
    ...[['home props', a.flight?.homeProps, b.flight?.homeProps], ['HTML', a.html, b.html], ['RSC scripts', a.flight, b.flight], ['RSC decoded', a.flight?.decoded, b.flight?.decoded]].flatMap(([name, previous, current]) => [metric(`${name} raw`, previous?.rawBytes, current?.rawBytes), metric(`${name} gzip`, previous?.gzipBytes, current?.gzipBytes)]),
  ];
  const excludedFields = b.flight?.homeProps?.fieldOccurrences;
  const fieldsAbsent = Boolean(excludedFields) && ['content', 'content_html', 'content_text', 'detailed_description'].every(field => excludedFields[field] === 0);
  output.homePayload = { sources, snapshots, metrics, beforeBodyFields: a.flight?.homeProps?.fieldOccurrences, afterBodyFields: excludedFields, fieldsAbsent };
  checks('Home API source SHA256 and query unchanged', sources.length === 4 && sources.every(source => source.passed), sources);
  checks('Saved home evidence byte counts/gzip/SHA256 verified', snapshots.length === 8 && snapshots.every(snapshot => snapshot.valid), snapshots);
  checks('Home DTO excludes full body fields', fieldsAbsent, excludedFields);
  checks('Home props/HTML/RSC raw and gzip all reduced', metrics.filter(item => !item.name.startsWith('API sources')).every(item => item.reduced), metrics);
}

function compareReading(before, after) {
  output.readingInventory = { lists: { before: inventory(before.lists, listKeys), after: inventory(after.lists, listKeys) }, details: { before: inventory(before.details, detailKeys), after: inventory(after.details, detailKeys) } };
  checks('Eight list and eight detail behavior records in each phase', Object.values(output.readingInventory).every(item => item.before.valid && item.after.valid), output.readingInventory);
  const oldLists = new Map((before.lists || []).map(page => [keyOf(page), page]));
  const oldDetails = new Map((before.details || []).map(page => [keyOf(page), page]));
  const requiredStates = ['initial', 'page2', 'initialSearch', 'noResults', 'tagSelected', 'sorted', 'filteredPage2', 'cleared'];
  for (const current of after.lists || []) {
    const previous = oldLists.get(keyOf(current));
    if (!previous) continue;
    const mobile = current.case.startsWith('mobile-');
    const found = differences(previous.states, current.states, 'states');
    noteDifferences({ scope: 'list-functional-state', case: current.case, pathname: current.pathname }, found);
    const topDifference = current.initial?.firstCardDocumentTop - previous.initial?.firstCardDocumentTop;
    const functionalStates = requiredStates.every(name => Boolean(previous.states?.[name] && current.states?.[name])) && found.length === 0;
    const initialVisible = current.initial?.searchVisible === true && current.initial?.horizontalOverflow === false;
    const position = Number.isFinite(topDifference) && (mobile ? topDifference < 0 : Math.abs(topDifference) <= 0.5);
    const mobileBehavior = !mobile || (current.initial?.toggleVisible === true && current.initial?.sortVisible === false && current.initial?.tagsVisible === false && current.open?.sortVisible === true && current.open?.tagsVisible === true && current.closedSelected?.selectedTags?.length === 1 && /1/.test(current.closedSelected?.toggleText || '') && current.closedSelected?.sortVisible === false && current.closedSelected?.tagsVisible === false && current.closedTabStops?.length >= 5 && current.closedTabStops.every(stop => stop.inClosedPanel === false) && current.escape?.focusReturned === true && current.escape?.state?.panelVisible === false && current.expandedViewport?.viewport?.width === 768 && current.expandedViewport?.sortVisible === true && current.expandedViewport?.tagsVisible === true && current.expandedViewport?.toggleVisible === false && current.expandedViewport?.selectedTags?.length === 1 && current.expandedViewport?.sort === 'view_count');
    const desktopBehavior = mobile || (current.initial?.sortVisible === true && current.initial?.tagsVisible === true);
    output.lists.push({ case: current.case, pathname: current.pathname, functionalStates, stateDifferenceCount: found.length, searchVisibleAndNoOverflow: initialVisible, topBefore: previous.initial?.firstCardDocumentTop, topAfter: current.initial?.firstCardDocumentTop, topDifference, expectedPositionPassed: position, mobileBehavior, desktopBehavior, passed: functionalStates && initialVisible && position && mobileBehavior && desktopBehavior });
  }
  for (const current of after.details || []) {
    const previous = oldDetails.get(keyOf(current));
    if (!previous) continue;
    const mobile = current.case.startsWith('mobile-');
    const found = differences(previous.body, current.body, 'body');
    noteDifferences({ scope: 'detail-body', case: current.case, pathname: current.pathname }, found);
    const headingCount = current.body?.headings?.length || 0;
    const bodyEligible = current.body?.text?.length >= 1200 && headingCount >= 3;
    const documentIdsUnique = Array.isArray(current.duplicateDocumentIds) && current.duplicateDocumentIds.length === 0;
    const headingIdsValid = current.ids?.length === headingCount && current.ids.every(item => item.id && item.occurrences === 1 && item.tabIndex === -1);
    const linksValid = current.links?.length === headingCount && current.links.every(link => link.exists === true && link.inBody === true && link.heading === true && link.focused === true && Number.isFinite(link.headingTop) && link.headingTop >= Math.max(0, link.headerBottom) - 0.5 && link.headingBottom <= (mobile ? 844 : 1000) && decodeURIComponent(link.href?.slice(1) || '') === link.id && decodeURIComponent(link.hash?.slice(1) || '') === link.id);
    const responsiveDefault = current.tocCount === 1 && current.initialOpen === !mobile && current.linkCount === headingCount && previous.tocCount === 0;
    const fixtureCoverage = current.koreanHeadingCount > 0 && current.duplicateHeadingTexts?.length > 0;
    output.details.push({ case: current.case, pathname: current.pathname, bodyDifferenceCount: found.length, bodyPreserved: found.length === 0, bodyEligible, headingCount, responsiveDefault, documentIdsUnique, headingIdsValid, linksValid, koreanAndDuplicateHeadingCoverage: fixtureCoverage, imageCount: current.body?.images?.length, linkCount: current.body?.links?.length, tableCount: current.body?.tables?.length, passed: found.length === 0 && bodyEligible && responsiveDefault && documentIdsUnique && headingIdsValid && linksValid && fixtureCoverage });
  }
  compareHome(before, after);
}

try {
  const capture = { before: readReport('before', 'report.json'), after: readReport('after', 'report.json') };
  const reading = { before: readReport('before', 'reading.json'), after: readReport('after', 'reading.json') };
  checks('All four input reports exist', output.missingInputs.length === 0, output.missingInputs);
  if (output.missingInputs.length === 0) {
    compareScreens(capture.before, capture.after);
    compareReading(reading.before, reading.after);
    const allReports = [capture.before, capture.after, reading.before, reading.after];
    checks('All original capture and reading runs passed', allReports.every(report => report.passed === true));
    checks('All saved behavior gates passed', ['before', 'after'].every(phase => Array.isArray(reading[phase].checks) && reading[phase].checks.length > 0 && reading[phase].checks.every(check => check.passed === true)));
    checks('No external requests or browser errors in any run', allReports.every(report => Array.isArray(report.blockedRequests) && report.blockedRequests.length === 0 && Array.isArray(report.browserErrors) && report.browserErrors.length === 0));
    output.hardGate = { matched32Cases: output.screenInventory.before.valid && output.screenInventory.after.valid, unchanged20TextStyleLayout: output.pages.filter(page => !page.intentionalChange).length === 20 && output.pages.filter(page => !page.intentionalChange).every(page => page.unchangedVisualGatePassed), desktopListFullVisibleBodyText4: output.pages.filter(desktopList).length === 4 && output.pages.filter(desktopList).every(page => page.fullVisibleBodyTextEqual), intended12Behavior: output.pages.filter(page => page.intentionalChange).length === 12 && output.lists.filter(page => page.case.startsWith('mobile-')).length === 4 && output.lists.every(page => page.passed) && output.details.length === 8 && output.details.every(page => page.passed), imageIdentityAndActual200All32: output.pages.length === 32 && output.pages.every(page => page.image.passed), titleAndViewportAll32: output.pages.length === 32 && output.pages.every(page => page.titleAndViewportPassed), allEvidenceChecks: output.checks.every(check => check.passed) };
  }
} catch (error) {
  output.error = error.stack;
  checks('Offline comparison completed', false, error.message);
}

checks('Original input reports remained unchanged', output.inputs.every(input => sha256(fs.readFileSync(path.join(root, input.file))) === input.sha256));
output.summary = { unchanged20Passed: output.pages.filter(page => !page.intentionalChange && page.unchangedVisualGatePassed).length, desktopListFullVisibleBodyText4Passed: output.pages.filter(desktopList).filter(page => page.fullVisibleBodyTextEqual).length, intended12Observed: output.pages.filter(page => page.intentionalChange).length, listBehavior8Passed: output.lists.filter(page => page.passed).length, detailTOC8Passed: output.details.filter(page => page.passed).length, images32Passed: output.pages.filter(page => page.image.passed).length, ignoredZeroSizeMainPOrButtonRows: output.hiddenDesignExclusions.length, scopedTruncatedTextDiagnosticRows: output.diagnostics.desktopListTruncatedText.length, hardDifferenceCount: output.totalDifferenceCount, displayedDifferences: output.differences.length, failedChecks: output.checks.filter(check => !check.passed).map(check => check.name) };
output.passed = !output.error && output.missingInputs.length === 0 && Object.keys(output.hardGate).length > 0 && Object.values(output.hardGate).every(Boolean) && output.checks.every(check => check.passed);
fs.mkdirSync(root, { recursive: true });
if (fs.existsSync(outputFile)) fs.copyFileSync(outputFile, path.join(root, `reading-comparison.previous-${new Date().toISOString().replace(/[:.]/g, '-')}.json`), fs.constants.COPYFILE_EXCL);
fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
console.log(JSON.stringify({ passed: output.passed, summary: output.summary, hardGate: output.hardGate, homePayloadMetrics: output.homePayload?.metrics || [], differences: output.differences, report: outputFile }, null, 2));
if (!output.passed) process.exitCode = 1;
