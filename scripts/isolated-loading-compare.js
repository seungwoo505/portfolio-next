// 저장된 로컬 JSON만 비교하며 서버나 브라우저를 실행하지 않는다.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.env.ISOLATED_PERFORMANCE_ROOT || path.join(__dirname, '../.verification/loading-optimization-20261113'));
const read = phase => JSON.parse(fs.readFileSync(path.join(root, phase, 'loading.json'), 'utf8'));
const before = read('before'), after = read('after');
const cases = ['desktop-light', 'desktop-dark', 'mobile-light', 'mobile-dark'];
const modes = ['home', 'requests', 'blog'];
const output = { generatedAt: new Date().toISOString(), method: '프로필별 새 browser context 5회, 동일 고정 지연. 홈은 HTML 응답부터 h1, 블로그는 posts 요청부터 카드 표시. 합성 측정이며 운영 속도 추정값이 아니다.', delaysMs: before.delaysMs, gates: {}, rows: [] };
const comparable = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sources = rows => [...new Set(rows.flatMap(row => row.requests.map(request => { const url = new URL(request.url); url.searchParams.delete('_t'); url.searchParams.sort(); return url.href; })))].sort();
output.gates.sameEnvironment = before.nodeVersion === after.nodeVersion && before.baseUrl === after.baseUrl && before.apiUrl === after.apiUrl && comparable(before.delaysMs, after.delaysMs);
output.gates.capturesPassed = before.passed === true && after.passed === true;
output.gates.noExternalRequestsOrBrowserErrors = [before, after].every(report => report.blockedRequests.length === 0 && report.browserErrors.length === 0);
output.gates.same120Samples = [before, after].every(report => report.samples.length === 60 && cases.every(name => modes.every(mode => { const rows = report.samples.filter(row => row.case === name && row.mode === mode); return rows.length === 5 && [1, 2, 3, 4, 5].every(repeat => rows.some(row => row.repeat === repeat)); })));
output.gates.serverHomeContent = before.noJavaScript.length === 4 && after.noJavaScript.length === 4 && cases.every(name => { const a = before.noJavaScript.find(row => row.case === name), b = after.noJavaScript.find(row => row.case === name); return a?.headings === 0 && a.loadingStates === 1 && b?.headings === 1 && b.featuredProjects === 2 && b.loadingStates === 0; });
output.gates.requestsHaveCompleted = [before, after].every(report => report.samples.every(row => row.requests.every(request => Number.isFinite(request.endMs) && request.endMs >= request.startMs)));
output.gates.sameQueries = true;
output.gates.publicSettingsMerged = true;
output.gates.mediansImproved = true;
for (const name of cases) {
  for (const mode of modes) {
    const oldRows = before.samples.filter(row => row.case === name && row.mode === mode), newRows = after.samples.filter(row => row.case === name && row.mode === mode);
    if (!comparable(sources(oldRows), sources(newRows))) output.gates.sameQueries = false;
    if (mode === 'requests' && (!oldRows.every(row => row.settingsRequests === 2 && row.profileRequests === 1) || !newRows.every(row => row.settingsRequests === 1 && row.profileRequests === 1))) output.gates.publicSettingsMerged = false;
    const old = before.medians.find(row => row.case === name && row.mode === mode), current = after.medians.find(row => row.case === name && row.mode === mode);
    const field = mode === 'home' ? 'targetFromHtmlResponseMs' : mode === 'requests' ? 'footerRequestsCompleteMs' : 'blogCardFromPostsMs';
    const improved = Number.isFinite(old?.[field]) && Number.isFinite(current?.[field]) && current[field] < old[field];
    if (!improved) output.gates.mediansImproved = false;
    output.rows.push({ case: name, mode, metric: field, beforeMs: old?.[field], afterMs: current?.[field], reductionRatio: improved ? 1 - current[field] / old[field] : null, settingsRequestsBefore: old?.settingsRequests, settingsRequestsAfter: current?.settingsRequests, profileGapBeforeMs: old?.profileStartGapMs, profileGapAfterMs: current?.profileStartGapMs });
  }
}
output.passed = Object.values(output.gates).every(value => value === true);
fs.writeFileSync(path.join(root, 'loading-comparison.json'), JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
assert.ok(output.passed, '로컬 전후 측정 비교가 실패했습니다.');
