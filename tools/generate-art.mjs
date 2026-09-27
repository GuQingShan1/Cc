#!/usr/bin/env node
// Generates the app's art from tools/art-manifest.json via the OpenAI Images API and writes optimised files into www/assets.
// Usage: OPENAI_API_KEY=... node tools/generate-art.mjs [--dry-run] [--force] [--only id,id] [--android] [--quality low|medium|high]
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const dryRun = flag('--dry-run');
const force = flag('--force');
const android = flag('--android');
const only = opt('--only', '').split(',').filter(Boolean);
const quality = opt('--quality', 'high');
const BUDGET = 6 * 1024 * 1024;
const API_URL = 'https://api.openai.com/v1/images/generations';

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tools/art-manifest.json'), 'utf8'));
const assetsDir = path.join(root, 'www/assets');
const rawDir = path.join(root, 'art/raw');
fs.mkdirSync(rawDir, { recursive: true });

const key = process.env.OPENAI_API_KEY;
if (!key && !dryRun) {
    console.error('OPENAI_API_KEY is not set. Run with --dry-run to preview requests, or export OPENAI_API_KEY.');
    process.exit(2);
}

const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function requestFor(asset) {
    const model = manifest.endpoints[asset.endpoint] || manifest.endpoints.flare;
    return {
        url: API_URL,
        body: {
            model,
            prompt: `${asset.prompt}. ${manifest.styleSuffix}`,
            size: asset.size,
            quality,
            output_format: 'png',
            n: 1,
        },
    };
}

async function submit(asset) {
    const { url, body } = requestFor(asset);
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            if (!res.ok) {
                const text = await res.text();
                const fatal = res.status === 400 || res.status === 401 || res.status === 403 || text.includes('insufficient_quota');
                const error = new Error(`generate ${res.status}: ${text}`);
                if (fatal) { error.fatal = true; }
                throw error;
            }
            const result = await res.json();
            const image = result.data && result.data[0];
            if (!image || !image.b64_json) throw new Error('no b64_json in response');
            return Buffer.from(image.b64_json, 'base64');
        } catch (error) {
            console.warn(`  attempt ${attempt} failed: ${error.message}`);
            if (error.fatal || attempt === 3) throw error;
            await sleep(3000 * attempt);
        }
    }
}

async function optimise(asset, rawPath) {
    const { default: sharp } = await import('sharp');
    const outPath = path.join(assetsDir, asset.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    let img = sharp(rawPath).resize({ width: asset.width, withoutEnlargement: true });
    if (asset.format === 'webp') img = img.webp({ quality: asset.quality || 78, effort: 6 });
    else img = img.png({ compressionLevel: 9 });
    await img.toFile(outPath);
    const meta = await sharp(outPath).metadata();
    return { src: `assets/${asset.out}`, w: meta.width, h: meta.height, bytes: fs.statSync(outPath).size };
}

async function pwaIcons(rawPath) {
    const { default: sharp } = await import('sharp');
    for (const size of [192, 512]) {
        const out = path.join(assetsDir, `icons/app-${size}.png`);
        await sharp(rawPath).resize(size, size).png().toFile(out);
    }
}

async function androidIcons(rawPath) {
    const { default: sharp } = await import('sharp');
    const res = path.join(root, 'android/app/src/main/res');
    const sizes = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
    for (const [dpi, px] of Object.entries(sizes)) {
        const dir = path.join(res, `mipmap-${dpi}`);
        fs.mkdirSync(dir, { recursive: true });
        // Adaptive foreground: the artwork occupies the centre 66% safe zone.
        const inner = Math.round(px * 0.66);
        const pad = Math.round((px - inner) / 2);
        await sharp(rawPath).resize(inner, inner).extend({ top: pad, bottom: px - inner - pad, left: pad, right: px - inner - pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png().toFile(path.join(dir, 'ic_launcher_foreground.png'));
    }
    for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
        const file = path.join(res, 'mipmap-anydpi-v26', name);
        fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('@drawable/ic_launcher_foreground', '@mipmap/ic_launcher_foreground'));
    }
    console.log('  wrote Android adaptive icon foregrounds');
}

async function main() {
    const selected = manifest.assets.filter((a) => !only.length || only.includes(a.id));
    const existing = fs.existsSync(path.join(assetsDir, 'manifest.json'))
        ? JSON.parse(fs.readFileSync(path.join(assetsDir, 'manifest.json'), 'utf8')).assets || {}
        : {};
    const results = { ...existing };
    let queue = selected.slice();
    let active = 0;

    const runOne = async (asset) => {
        const outPath = path.join(assetsDir, asset.out);
        if (fs.existsSync(outPath) && !force) {
            console.log(`skip ${asset.id} (exists)`);
            return;
        }
        const req = requestFor(asset);
        if (dryRun) {
            console.log(`${asset.id}: POST ${req.url}\n  ${JSON.stringify(req.body)}`);
            return;
        }
        console.log(`generate ${asset.id} via ${req.body.model}`);
        const rawPath = path.join(rawDir, `${asset.id}.png`);
        if (!fs.existsSync(rawPath) || force) fs.writeFileSync(rawPath, await submit(asset));
        results[asset.id] = await optimise(asset, rawPath);
        if (asset.id === 'icon-app') {
            await pwaIcons(rawPath);
            if (android) await androidIcons(rawPath);
        }
        console.log(`  -> ${asset.out} ${(results[asset.id].bytes / 1024).toFixed(0)} KiB`);
    };

    await new Promise((resolve, reject) => {
        const next = () => {
            if (!queue.length && active === 0) return resolve();
            while (active < 2 && queue.length) {
                const asset = queue.shift();
                active++;
                runOne(asset).then(() => { active--; next(); }, reject);
            }
        };
        next();
    });

    if (dryRun) return;
    for (const id of Object.keys(results)) {
        if (!fs.existsSync(path.join(root, 'www', results[id].src))) delete results[id];
    }
    fs.writeFileSync(path.join(assetsDir, 'manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), assets: results }, null, 2) + '\n');
    const total = Object.values(results).reduce((s, r) => s + r.bytes, 0);
    console.log(`manifest written: ${Object.keys(results).length} assets, ${(total / 1024 / 1024).toFixed(2)} MB`);
    if (total > BUDGET) {
        console.error(`assets exceed the ${BUDGET / 1024 / 1024} MB budget`);
        process.exit(1);
    }
}

main().catch((error) => { console.error(error); process.exit(1); });
