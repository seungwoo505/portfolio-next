// Read saved local evidence only. This tool makes no network requests and starts no servers/browsers.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../.verification/performance');
const phases = ['before', 'css', 'images', 'after'];
const reports = Object.fromEntries(phases.map(phase => { const file = path.join(root, phase, 'report.json'); return [phase, fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null]; }));
const expectedCases = ['desktop-light', 'desktop-dark', 'mobile-light', 'mobile-dark'];
const expectedPaths = ['/', '/projects', '/projects/fixture-project-1', '/blog', '/blog/fixture-post-1', '/about', '/contact', '/settings'];
const expectedKeys = expectedCases.flatMap(name => expectedPaths.map(pathname => `${name} ${pathname}`));
const keyOf = page => `${page.case} ${page.pathname}`;
const normalize = value => typeof value === 'string' ? value.replace(/조회\s*\d+/g, '<count>') : value;
const median = values => { const sorted = [...values].sort((a, b) => a - b); const middle = sorted.length >> 1; return sorted.length ? sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2 : null; };
let sharp; try { sharp = require('sharp'); } catch {}
const output = { generatedAt: new Date().toISOString(), method: { textNormalization: 'Only /조회\\s*\\d+/g is replaced with <count>; original reports remain unchanged.', rectTolerancePx: 0.5, pixelComparison: 'Diagnostic only: exact image rectangles from both documents are excluded; all other pixel changes are counted without text masking.', timing: 'Recomputed from raw requests: first project-list start and last settings start, five samples per case.', syntheticRaster: 'Synthetic JPEG byte savings and fixed local delays do not predict production speed.' }, missingPhases: phases.filter(phase => !reports[phase]), stages: {}, timing: [], hardGate: {} };

function differences(before, after, key = '', found = []) {
  if (typeof before === 'number' && typeof after === 'number' && /(?:^|\.)rect\./.test(key) && Math.abs(before - after) <= 0.5) return found;
  if (typeof before === 'string' && typeof after === 'string' && /(?:^|\.)(?:text|bodyText)$/.test(key)) { before = normalize(before); after = normalize(after); }
  if (before && after && typeof before === 'object' && typeof after === 'object' && Array.isArray(before) === Array.isArray(after)) {
    for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) differences(before[name], after[name], key ? `${key}.${name}` : name, found);
  } else if (before !== after) found.push({ key, before: before === undefined ? '<missing>' : before, after: after === undefined ? '<missing>' : after });
  return found;
}

function sourceOf(src, baseUrl) {
  if (!src || /^(?:data:|blob:)/.test(src)) return src;
  const url = new URL(src, baseUrl);
  return url.pathname === '/_next/image' && url.searchParams.has('url') ? new URL(url.searchParams.get('url'), baseUrl).href : url.href;
}

function imageEvidence(page, baseline, baseUrl) {
  const responses = page.imageAndApiResponses || [];
  const badRequests = responses.filter(response => (response.type === 'image' || /\/_next\/image(?:\?|$)/.test(response.url)) && (response.status < 200 || response.status >= 300));
  const images = (page.images || []).map((image, index) => {
    const response = responses.find(item => item.url === image.currentSrc && item.status >= 200 && item.status < 300);
    const source = sourceOf(image.currentSrc || image.src, baseUrl);
    const before = baseline?.images?.[index];
    const beforeResponse = (baseline?.imageAndApiResponses || []).find(item => item.url === before?.currentSrc && item.status >= 200 && item.status < 300);
    const originalBytes = beforeResponse?.decodedBodyBytes ?? null;
    const localInline = /^(?:data:|blob:)/.test(image.currentSrc || image.src);
    const identityEqual = Boolean(before && source === sourceOf(before.currentSrc || before.src, baseUrl) && normalize(image.alt) === normalize(before.alt));
    const valid = image.complete && image.naturalWidth > 0 && image.naturalHeight > 0 && (localInline || Boolean(response)) && identityEqual;
    return { index, alt: image.alt, initialViewport: image.initialViewport, src: image.src, currentSrc: image.currentSrc, decodedSource: source, identityEqual, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, rect: image.rect, status: response?.status || (localInline ? 'inline' : 'missing'), contentType: response?.contentType || null, contentLength: response?.contentLength ?? null, decodedBodyBytes: response?.decodedBodyBytes ?? null, encodedResponseBodyBytes: response?.networkSizes?.responseBodySize ?? null, nextImageWidth: response?.nextImageWidth ?? null, before: { currentSrc: before?.currentSrc, status: beforeResponse?.status || (localInline ? 'inline' : 'missing'), contentType: beforeResponse?.contentType || null, decodedBodyBytes: originalBytes, encodedResponseBodyBytes: beforeResponse?.networkSizes?.responseBodySize ?? null }, payloadReductionRatio: originalBytes && Number.isFinite(response?.decodedBodyBytes) ? 1 - response.decodedBodyBytes / originalBytes : null, valid };
  });
  return { images, badRequests, passed: images.every(image => image.valid) && badRequests.length === 0 };
}

async function pixels(before, after, phase) {
  if (!sharp) return { available: false, reason: 'Existing sharp dependency unavailable' };
  const beforeFile = path.join(root, 'before', `${before.screenshotPrefix}-viewport.png`);
  const afterFile = path.join(root, phase, `${after.screenshotPrefix}-viewport.png`);
  if (!fs.existsSync(beforeFile) || !fs.existsSync(afterFile)) return { available: false, reason: 'Viewport PNG missing' };
  const [a, b] = await Promise.all([sharp(beforeFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true }), sharp(afterFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true })]);
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) return { available: true, dimensionsEqual: false, before: a.info, after: b.info };
  const { width, height } = a.info; const mask = new Uint8Array(width * height);
  for (const image of [...(before.images || []), ...(after.images || [])]) {
    const r = image.rect;
    for (let y = Math.max(0, Math.floor(r.y)); y < Math.min(height, Math.ceil(r.y + r.height)); y++) mask.fill(1, y * width + Math.max(0, Math.floor(r.x)), y * width + Math.min(width, Math.max(0, Math.ceil(r.x + r.width))));
  }
  let compared = 0; let changed = 0; let changedOver16 = 0; let maxChannelDelta = 0;
  for (let index = 0; index < mask.length; index++) if (!mask[index]) {
    compared++; let delta = 0;
    for (let channel = 0; channel < 4; channel++) delta = Math.max(delta, Math.abs(a.data[index * 4 + channel] - b.data[index * 4 + channel]));
    if (delta) changed++; if (delta > 16) changedOver16++; maxChannelDelta = Math.max(maxChannelDelta, delta);
  }
  return { available: true, dimensionsEqual: true, width, height, maskedImagePixels: mask.length - compared, comparedPixels: compared, changedPixels: changed, changedRatio: compared ? changed / compared : 0, changedOver16Pixels: changedOver16, changedOver16Ratio: compared ? changedOver16 / compared : 0, maxChannelDelta };
}

async function stage(phase) {
  const baseline = reports.before; const current = reports[phase];
  if (!baseline || !current) return;
  const beforeMap = new Map((baseline.pages || []).map(page => [keyOf(page), page]));
  const afterMap = new Map((current.pages || []).map(page => [keyOf(page), page]));
  const result = { diagnosticOnly: phase !== 'after', actualPageCount: current.pages?.length || 0, uniquePageCount: afterMap.size, missingKeys: expectedKeys.filter(key => !beforeMap.has(key) || !afterMap.has(key)), unexpectedKeys: [...afterMap.keys()].filter(key => !expectedKeys.includes(key)), pages: [], differences: [], totalDifferenceCount: 0, blockedRequests: current.blockedRequests || [], browserErrors: current.browserErrors || [], sourceJpeg: current.rasterSource || baseline.rasterSource, cssAssets: current.cssAssets || [], cssTotals: current.cssTotals || null };
  for (const key of expectedKeys) {
    const before = beforeMap.get(key); const after = afterMap.get(key); if (!before || !after) continue;
    const checked = ['title', 'bodyText', 'viewport', 'document', 'design'];
    const found = checked.flatMap(field => differences(before[field], after[field], field));
    found.push(...differences((before.images || []).map(image => ({ alt: image.alt, rect: image.rect })), (after.images || []).map(image => ({ alt: image.alt, rect: image.rect })), 'images'));
    result.totalDifferenceCount += found.length;
    for (const item of found) if (result.differences.length < 20) result.differences.push({ case: after.case, pathname: after.pathname, selector: item.key.startsWith('design.') ? after.design?.[Number(item.key.split('.')[1])]?.selector : null, ...item });
    const image = imageEvidence(after, before, current.baseUrl);
    const css = { rawBefore: before.css.rawBytes, rawAfter: after.css.rawBytes, gzipBefore: before.css.gzipBytes, gzipAfter: after.css.gzipBytes, rawReductionRatio: 1 - after.css.rawBytes / before.css.rawBytes, gzipReductionRatio: 1 - after.css.gzipBytes / before.css.gzipBytes };
    result.pages.push({ case: after.case, pathname: after.pathname, passed: found.length === 0 && image.passed, styleLayoutTextPassed: found.length === 0, differenceCount: found.length, bodyTextNormalizedEqual: normalize(before.bodyText) === normalize(after.bodyText), css, image, pixels: await pixels(before, after, phase) });
  }
  result.styleLayoutTextPassedCount = result.pages.filter(page => page.styleLayoutTextPassed).length;
  result.imagePassedCount = result.pages.filter(page => page.image.passed).length;
  output.stages[phase] = result;
}

function timingFor(report, name) {
  const samples = (report?.projectTiming?.samples || []).filter(sample => sample.case === name).map(sample => {
    const projects = sample.requests?.find(request => /\/(?:public\/)?projects(?:\?|$)/.test(request.url));
    const settings = sample.requests?.filter(request => /\/(?:public\/)?settings(?:\?|$)/.test(request.url)).at(-1);
    return { repeat: sample.repeat, firstCardMs: sample.firstCardMs, projectsStartMs: projects?.startMs ?? null, lastSettingsStartMs: settings?.startMs ?? null, requestStartGapMs: projects && settings ? settings.startMs - projects.startMs : null, cardFromProjectsRequestMs: projects ? sample.firstCardMs - projects.startMs : null, requests: sample.requests, routeCalls: sample.routeCalls };
  });
  const medians = Object.fromEntries(['firstCardMs', 'projectsStartMs', 'lastSettingsStartMs', 'requestStartGapMs', 'cardFromProjectsRequestMs'].map(field => [field, median(samples.map(sample => sample[field]).filter(Number.isFinite))]));
  const queries = [...new Set(samples.flatMap(sample => sample.requests || []).filter(request => /\/(?:public\/)?projects(?:\?|$)/.test(request.url)).map(request => { const url = new URL(request.url); url.searchParams.delete('_t'); url.searchParams.sort(); return url.href; }))];
  return { sampleCount: samples.length, valid: samples.length === 5 && samples.every(sample => Number.isFinite(sample.cardFromProjectsRequestMs) && Number.isFinite(sample.requestStartGapMs)), delaysMs: report?.projectTiming?.delaysMs || null, projectQueries: queries, medians, samples };
}

(async () => {
  for (const phase of ['css', 'images', 'after']) await stage(phase);
  for (const name of expectedCases) {
    const before = timingFor(reports.before, name); const after = timingFor(reports.after, name);
    const beforeMs = before.medians.cardFromProjectsRequestMs; const afterMs = after.medians.cardFromProjectsRequestMs;
    output.timing.push({ case: name, before, after, sameQueries: JSON.stringify(before.projectQueries) === JSON.stringify(after.projectQueries), sameDelays: JSON.stringify(before.delaysMs) === JSON.stringify(after.delaysMs), cardImprovementMs: beforeMs !== null && afterMs !== null ? beforeMs - afterMs : null, cardReductionRatio: beforeMs && afterMs !== null ? 1 - afterMs / beforeMs : null });
  }
  const final = output.stages.after;
  output.hardGate = { expectedPages: 32, matched32Cases: Boolean(final && final.actualPageCount === 32 && final.uniquePageCount === 32 && final.missingKeys.length === 0 && final.unexpectedKeys.length === 0), styleLayoutText32Passed: final?.styleLayoutTextPassedCount === 32, imageRequestsAndSources32Passed: final?.imagePassedCount === 32, noExternalRequestsOrBrowserErrors: Boolean(reports.before && reports.after && [reports.before, reports.after].every(report => Array.isArray(report.blockedRequests) && Array.isArray(report.browserErrors) && report.blockedRequests.length === 0 && report.browserErrors.length === 0)), finalCapturePassed: reports.after?.passed === true, timing20SamplesComparable: output.timing.every(item => item.before.valid && item.after.valid && item.sameQueries && item.sameDelays) };
  output.passed = Object.values(output.hardGate).every(value => value === true || value === 32);
  fs.writeFileSync(path.join(root, 'comparison.json'), JSON.stringify(output, null, 2));
  console.log(JSON.stringify({ passed: output.passed, hardGate: output.hardGate, phases: Object.fromEntries(Object.entries(output.stages).map(([phase, result]) => [phase, { styleLayoutTextPassedCount: result.styleLayoutTextPassedCount, imagePassedCount: result.imagePassedCount, totalDifferenceCount: result.totalDifferenceCount }])), timing: output.timing.map(item => ({ case: item.case, beforeMs: item.before.medians.cardFromProjectsRequestMs, afterMs: item.after.medians.cardFromProjectsRequestMs, reductionRatio: item.cardReductionRatio })) }, null, 2));
  if (!output.passed) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
