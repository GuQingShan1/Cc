(function (root) {
    const CS = (root.CS = root.CS || {});
    const STAGE_TINT = [
        { hue: '0deg', bright: 0.85 },
        { hue: '18deg', bright: 0.92 },
        { hue: '60deg', bright: 0.95 },
        { hue: '120deg', bright: 1 },
        { hue: '190deg', bright: 1 },
        { hue: '260deg', bright: 1.05 },
        { hue: '320deg', bright: 1.1 },
    ];

    const art = {
        manifest: null,
        stage: -1,
        layer: 'a',

        async init() {
            const disabled = /[?&]art=0/.test(root.location ? root.location.search : '');
            if (disabled) return;
            let manifest = root.ART_MANIFEST || null;
            if (!manifest && typeof fetch === 'function') {
                try {
                    const res = await fetch('assets/manifest.json', { cache: 'no-cache' });
                    const text = await res.text();
                    manifest = JSON.parse(text);
                } catch (error) {
                    manifest = null;
                }
            }
            if (!manifest || !manifest.assets) return;
            this.manifest = manifest;
            const rootEl = document.documentElement;
            for (const [id, entry] of Object.entries(manifest.assets)) {
                rootEl.style.setProperty(`--art-${id}`, `url("${entry.src}")`);
            }
            rootEl.classList.add('has-art');
            if (this.stage >= 0) this.setStage(this.stage, true);
        },

        has(id) {
            return Boolean(this.manifest && this.manifest.assets && this.manifest.assets[id]);
        },

        src(id) {
            return this.has(id) ? this.manifest.assets[id].src : null;
        },

        img(id, alt, className) {
            const src = this.src(id);
            return src ? `<img src="${src}" alt="${alt || ''}" class="${className || ''}" loading="lazy">` : '';
        },

        setStage(index, immediate) {
            const tint = STAGE_TINT[Math.max(0, Math.min(STAGE_TINT.length - 1, index))];
            const rootEl = document.documentElement;
            rootEl.style.setProperty('--stage-hue', tint.hue);
            rootEl.style.setProperty('--stage-bright', String(tint.bright));
            const changed = this.stage !== index;
            this.stage = index;
            const src = this.src(`bg-stage-${index}`);
            const layers = {
                a: document.querySelector('.bg-art[data-layer="a"]'),
                b: document.querySelector('.bg-art[data-layer="b"]'),
            };
            if (!layers.a || !layers.b) return;
            if (!src) {
                layers.a.classList.remove('is-visible');
                layers.b.classList.remove('is-visible');
                return;
            }
            if (!changed && !immediate) return;
            const next = this.layer === 'a' ? 'b' : 'a';
            layers[next].style.backgroundImage = `url("${src}")`;
            layers[next].classList.add('is-visible');
            layers[this.layer].classList.remove('is-visible');
            this.layer = next;
        },
    };

    CS.art = art;
})(typeof window !== 'undefined' ? window : globalThis);
