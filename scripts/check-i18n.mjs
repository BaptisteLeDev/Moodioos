import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const localesDir = path.join(srcDir, 'locales');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const fr = JSON.parse(fs.readFileSync(path.join(localesDir, 'fr.json'), 'utf8'));

function findKeys(obj, prefix = '') {
  const keys = new Set();
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    const p = prefix ? `${prefix}.${k}` : k;
    keys.add(p);
    if (val && typeof val === 'object') {
      for (const sub of findKeys(val, p)) keys.add(sub);
    }
  }
  return keys;
}

const enKeys = findKeys(en);
const frKeys = findKeys(fr);

// scan files for t\(locale, 'key' occurrences
function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && /\.(ts|js|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const files = walk(srcDir);
const keyRegex = /t\(locale,\s*'([a-z0-9_.-]+)'/g;
const usedKeys = new Set();
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = keyRegex.exec(content))) {
    usedKeys.add(m[1]);
  }
}

const missingInEn = [];
const missingInFr = [];
for (const k of usedKeys) {
  if (!enKeys.has(k)) missingInEn.push(k);
  if (!frKeys.has(k)) missingInFr.push(k);
}

console.log('Used keys:', usedKeys.size);
console.log('Missing in en.json:', missingInEn.length);
console.log(missingInEn.join('\n'));
console.log('Missing in fr.json:', missingInFr.length);
console.log(missingInFr.join('\n'));

if (missingInEn.length === 0 && missingInFr.length === 0) {
  console.log('All keys present in both locales ✅');
  process.exit(0);
} else {
  process.exit(2);
}
