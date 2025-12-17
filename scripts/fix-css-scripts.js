const fs = require('fs');
const path = require('path');

/**
 * CSS 파일을 script 태그로 로드하는 잘못된 태그를 제거합니다.
 * Next.js static export 버그로 인해 CSS가 script 태그로 추가되는 문제를 해결합니다.
 */
function fixCSSScripts(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      fixCSSScripts(fullPath);
    } else if (file.name.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      // CSS 파일을 script 태그로 로드하는 잘못된 태그 제거
      // <script src="/_next/static/css/..." async=""></script> 패턴 제거
      content = content.replace(
        /<script[^>]*src="\/_next\/static\/css\/[^"]+\.css"[^>]*><\/script>/gi,
        ''
      );
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed: ${fullPath}`);
      }
    }
  }
}

const outDir = path.join(__dirname, '..', 'out');
if (fs.existsSync(outDir)) {
  console.log('Fixing CSS script tags in HTML files...');
  fixCSSScripts(outDir);
  console.log('Done!');
} else {
  console.error('out directory not found. Please run "npm run build" first.');
  process.exit(1);
}
