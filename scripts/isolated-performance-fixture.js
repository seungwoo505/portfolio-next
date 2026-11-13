// Deterministic synthetic raster used only for local before/after comparisons.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
async function prepare() {
  const directory = path.resolve(__dirname, '../.verification/performance/fixtures');
  fs.mkdirSync(directory, { recursive: true });
  const grid = Array.from({ length: 44 }, (_, i) => `<path d="M${i * 65} 0v1440M0 ${i * 40}h2560" stroke="#fff" stroke-opacity=".1"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1440"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#0f766e"/><stop offset=".5" stop-color="#164e63"/><stop offset="1" stop-color="#18181b"/></linearGradient><radialGradient id="r"><stop stop-color="#5eead4" stop-opacity=".7"/><stop offset="1" stop-color="#5eead4" stop-opacity="0"/></radialGradient></defs><rect width="2560" height="1440" fill="url(#g)"/>${grid}<circle cx="1800" cy="340" r="980" fill="url(#r)"/><rect x="190" y="190" width="2180" height="1060" rx="72" fill="#09090b" fill-opacity=".26" stroke="#99f6e4" stroke-width="3"/><path d="m390 920 270-390 260 210 340-390 430 520 420-390" fill="none" stroke="#5eead4" stroke-width="24" stroke-linejoin="round"/><text x="310" y="1120" fill="#f4f4f5" font-family="Arial" font-size="76" letter-spacing="10">LOCAL PERFORMANCE FIXTURE</text></svg>`;
  const file = path.join(directory, 'cover.jpg');
  await sharp(Buffer.from(svg)).jpeg({ quality: 94, chromaSubsampling: '4:4:4' }).toFile(file);
  console.log(JSON.stringify({ file, bytes: fs.statSync(file).size, width: 2560, height: 1440, synthetic: true }));
}
prepare().catch(error => { console.error(error); process.exitCode = 1; });