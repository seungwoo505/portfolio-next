#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const OUT_DIR = path.join(process.cwd(), "out");
const CSS_SCRIPT_REGEX =
  /<script\b[^>]*src="[^"]+\.css"[^>]*>\s*<\/script>\s*/gi;

function collectHtmlFiles(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      return collectHtmlFiles(fullPath);
    }
    if (entry.isFile() && entry.name.endsWith(".html")) {
      return [fullPath];
    }
    return [];
  });
}

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    return;
  }

  const htmlFiles = collectHtmlFiles(OUT_DIR);
  let patchedCount = 0;

  htmlFiles.forEach((filePath) => {
    const original = fs.readFileSync(filePath, "utf8");
    const cleaned = original.replace(CSS_SCRIPT_REGEX, "");
    if (original !== cleaned) {
      fs.writeFileSync(filePath, cleaned, "utf8");
      patchedCount += 1;
    }
  });

  if (patchedCount > 0) {
    console.log(
      `[post-export-cleanup] Removed stray CSS <script> tags from ${patchedCount} file(s).`
    );
  }
}

main();
