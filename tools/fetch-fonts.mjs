// Copies the woff2 subsets the app needs from @fontsource packages into www/assets/fonts.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const out = path.join(root, 'www/assets/fonts');
fs.mkdirSync(out, { recursive: true });

const wanted = [
  ['@fontsource/zcool-xiaowei', 'zcool-xiaowei-latin-400-normal.woff2'],
  ['@fontsource/cinzel', 'cinzel-latin-400-normal.woff2'],
  ['@fontsource/cinzel', 'cinzel-latin-700-normal.woff2'],
  ['@fontsource/noto-sans', 'noto-sans-latin-400-normal.woff2'],
  ['@fontsource/noto-sans', 'noto-sans-latin-600-normal.woff2'],
  ['@fontsource/noto-sans', 'noto-sans-latin-700-normal.woff2'],
];

let total = 0;
for (const [pkg, file] of wanted) {
  const src = path.join(root, 'node_modules', pkg, 'files', file);
  if (!fs.existsSync(src)) { console.warn(`missing ${pkg}/${file}`); continue; }
  fs.copyFileSync(src, path.join(out, file));
  total += fs.statSync(src).size;
  console.log(`copied ${file} (${(fs.statSync(src).size / 1024).toFixed(1)} KiB)`);
}
console.log(`fonts total ${(total / 1024).toFixed(1)} KiB`);
