#!/usr/bin/env node
// Builds a single-file page for publishing as a claude.ai artifact: inlines the CSS/JS/fonts/images that
// www/index.html references (in order) and swaps the storage layer for the artifact `db` capability.
// Usage: node tools/build-artifact.mjs [outFile]
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const www = path.join(root, 'www');
const outFile = path.resolve(process.argv[2] || path.join(root, 'dist/artifact.html'));
const INLINE_LIMIT = 200 * 1024;
const MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff' };

const html = fs.readFileSync(path.join(www, 'index.html'), 'utf8');
const title = (html.match(/<title>([^<]*)<\/title>/) || [, 'Cultivation Schedule'])[1];
const cssFiles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
const jsFiles = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const body = html.match(/<body>([\s\S]*?)<script/)[1].trim();

function dataUri(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const buf = fs.readFileSync(filePath);
    return `data:${MIME[ext] || 'application/octet-stream'};base64,${buf.toString('base64')}`;
}

const skipped = [];
function inlineCss(file) {
    const dir = path.dirname(path.join(www, file));
    return fs.readFileSync(path.join(www, file), 'utf8').replace(/url\(("|')?(?!data:)([^"')]+)\1?\)/g, (match, q, ref) => {
        const target = path.resolve(dir, ref);
        if (!fs.existsSync(target)) return match;
        if (fs.statSync(target).size > INLINE_LIMIT) { skipped.push(ref); return match; }
        return `url("${dataUri(target)}")`;
    });
}

const css = cssFiles.map(inlineCss).join('\n');
let js = jsFiles.map((f) => fs.readFileSync(path.join(www, f), 'utf8')).join('\n');

const bootstrap = `    document.addEventListener('DOMContentLoaded', () => {
        root.app = new CultivationScheduleApp();
    });`;
if (!js.includes(bootstrap)) throw new Error('bootstrap anchor not found in app.js');
js = js.replace(bootstrap, `    async function createStore() {
        const db = root.claude && root.claude.use ? await root.claude.use('db') : null;
        if (!db) return CS.localStore;
        const doc = db.doc('state/main');
        let writing = null;
        let pending = null;
        const flush = () => {
            if (writing || !pending) return;
            const body = pending;
            pending = null;
            writing = doc.set(body)
                .catch(() => { if (root.app) CS.fx.toast('Progress could not be saved. Check your connection.', 'negative'); })
                .finally(() => { writing = null; flush(); });
        };
        return {
            async load() {
                const snap = await doc.get();
                return snap.exists ? JSON.parse(JSON.stringify(snap.data())) : null;
            },
            save(data) {
                pending = JSON.parse(JSON.stringify(data));
                flush();
            },
        };
    }

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const store = await createStore();
            root.app = new CultivationScheduleApp(await store.load(), store);
        } catch (error) {
            document.getElementById('view').innerHTML = '<div class="empty"><div class="empty__title">The Qi is unsettled</div><p>Your saved progress could not be loaded. Reload the page to try again.</p></div>';
        }
    });`);

const artManifest = fs.existsSync(path.join(www, 'assets/manifest.json'))
    ? JSON.parse(fs.readFileSync(path.join(www, 'assets/manifest.json'), 'utf8'))
    : { assets: {} };
for (const [id, entry] of Object.entries(artManifest.assets || {})) {
    const target = path.join(www, entry.src);
    if (fs.existsSync(target) && fs.statSync(target).size <= INLINE_LIMIT) entry.src = dataUri(target);
    else { skipped.push(entry.src); delete artManifest.assets[id]; }
}

const page = `<title>${title}</title>
<style>
${css}
:root { color-scheme: dark; }
</style>
${body}
<script>
window.ART_MANIFEST = ${JSON.stringify(artManifest)};
${js}
</script>
`;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, page);
console.log(`wrote ${path.relative(root, outFile)} (${(Buffer.byteLength(page) / 1024).toFixed(0)} KiB)`);
if (skipped.length) console.log(`not inlined (too large): ${skipped.join(', ')}`);
