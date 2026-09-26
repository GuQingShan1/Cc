(function (root) {
    const CS = (root.CS = root.CS || {});
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const fx = {
        canvas: null,
        ctx: null,
        particles: [],
        raf: 0,
        reduced: false,
        overlayResolve: null,

        init() {
            this.reduced = Boolean(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
            this.canvas = document.getElementById('fx');
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.resize();
                root.addEventListener('resize', () => this.resize());
            }
        },

        resize() {
            const dpr = Math.min(2, root.devicePixelRatio || 1);
            this.canvas.width = Math.floor(root.innerWidth * dpr);
            this.canvas.height = Math.floor(root.innerHeight * dpr);
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        },

        burst(from, to, count) {
            if (!this.ctx || this.reduced || !from || !to) return;
            const n = Math.max(8, Math.min(18, count || 12));
            const now = performance.now();
            for (let i = 0; i < n; i++) {
                this.particles.push({
                    x0: from.left + from.width / 2,
                    y0: from.top + from.height / 2,
                    x1: to.left + to.width / 2,
                    y1: to.top + to.height / 2,
                    cx: from.left + (Math.random() - 0.5) * 240,
                    cy: Math.min(from.top, to.top) - 60 - Math.random() * 120,
                    start: now + i * 18,
                    dur: 560 + Math.random() * 160,
                    r: 2 + Math.random() * 2.5,
                });
            }
            if (!this.raf) this.raf = requestAnimationFrame((t) => this.tick(t));
        },

        tick(t) {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, root.innerWidth, root.innerHeight);
            this.particles = this.particles.filter((p) => t < p.start + p.dur);
            for (const p of this.particles) {
                const k = Math.max(0, (t - p.start) / p.dur);
                const e = k * k * (3 - 2 * k);
                const x = (1 - e) * (1 - e) * p.x0 + 2 * (1 - e) * e * p.cx + e * e * p.x1;
                const y = (1 - e) * (1 - e) * p.y0 + 2 * (1 - e) * e * p.cy + e * e * p.y1;
                ctx.beginPath();
                ctx.arc(x, y, p.r * (1 - e * 0.5), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(232, 200, 119, ${0.9 - e * 0.6})`;
                ctx.shadowColor = 'rgba(232, 200, 119, 0.8)';
                ctx.shadowBlur = 8;
                ctx.fill();
            }
            if (this.particles.length) this.raf = requestAnimationFrame((tt) => this.tick(tt));
            else { this.raf = 0; ctx.clearRect(0, 0, root.innerWidth, root.innerHeight); }
        },

        tweenNumber(el, from, to, ms) {
            if (!el) return;
            if (this.reduced || from === to) { el.textContent = String(to); return; }
            const start = performance.now();
            const dur = ms || 500;
            const step = (t) => {
                const k = Math.min(1, (t - start) / dur);
                const e = 1 - Math.pow(1 - k, 3);
                el.textContent = String(Math.round(from + (to - from) * e));
                if (k < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        },

        pulse(el) {
            if (!el) return;
            el.classList.remove('is-pulsing');
            void el.offsetWidth;
            el.classList.add('is-pulsing');
        },

        toast(message, type) {
            const el = document.createElement('div');
            el.className = `toast toast--${type || 'neutral'}`;
            el.setAttribute('role', 'status');
            el.textContent = message;
            document.body.appendChild(el);
            setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 320); }, 2600);
        },

        showOverlay(html) {
            const overlay = document.getElementById('overlay');
            overlay.innerHTML = html;
            overlay.hidden = false;
            return new Promise((resolve) => { this.overlayResolve = resolve; });
        },

        dismiss() {
            const overlay = document.getElementById('overlay');
            if (!overlay || overlay.hidden) return;
            overlay.hidden = true;
            overlay.innerHTML = '';
            const resolve = this.overlayResolve;
            this.overlayResolve = null;
            if (resolve) resolve();
        },

        tribulation({ success, stage, chance, qi, bonus, title }) {
            const pct = Math.round(chance * 100);
            const html = `
                <div class="overlay__panel fx-trib" data-fx="trib">
                    <div class="fx-trib__sky"></div>
                    <div class="fx-trib__flash"></div>
                    <div class="fx-trib__panel">
                        <div class="fx-trib__label">Heavenly Tribulation</div>
                        <div class="fx-trib__stage">${esc(stage)}</div>
                        <svg class="fx-trib__bolt" viewBox="0 0 140 220" aria-hidden="true">
                            <polyline points="72,6 54,78 82,84 50,150 92,144 60,214"/>
                            <polyline class="b2" points="76,10 66,60 88,66 70,120 96,116 78,180"/>
                        </svg>
                        <div class="fx-trib__chance">${pct}% chance to withstand</div>
                        <div class="fx-trib__result" hidden>
                            ${success
                                ? `<span class="seal seal--gold seal--lg">Conquered</span>
                                   <p>The heavens part. You break through to <b>${esc(stage)}</b>${bonus ? ` and gather ${bonus} bonus Qi` : ''}.${title ? ` Title bestowed: "${esc(title)}".` : ''}</p>`
                                : `<span class="seal seal--lg">Failed</span>
                                   <p>The lightning scatters your foundation. Qi burned back to <b>${qi}</b>. Meditate a day before facing the heavens again.</p>`}
                        </div>
                        <div class="overlay__hint" hidden>Tap to continue</div>
                    </div>
                </div>`;
            const done = this.showOverlay(html);
            const panel = document.querySelector('[data-fx="trib"]');
            const strikeDelay = this.reduced ? 0 : 500;
            const resultDelay = this.reduced ? 0 : 1400;
            setTimeout(() => panel && panel.classList.add('is-striking'), strikeDelay);
            setTimeout(() => {
                if (!panel) return;
                const result = panel.querySelector('.fx-trib__result');
                const hint = panel.querySelector('.overlay__hint');
                if (result) result.hidden = false;
                if (hint) hint.hidden = false;
                panel.dataset.dismissable = 'true';
            }, resultDelay);
            return done;
        },

        breakthrough({ stage, title, bonus }) {
            const html = `
                <div class="overlay__panel fx-break" data-fx="break" data-dismissable="true">
                    <div class="fx-break__rays"></div>
                    <div class="fx-break__label">Breakthrough</div>
                    <div class="fx-break__stage gold-text">${esc(stage)}</div>
                    ${title ? `<div class="fx-break__title"><span class="seal seal--gold seal--lg">${esc(title)}</span></div>` : ''}
                    ${bonus ? `<div class="fx-break__bonus">+${bonus} Qi</div>` : ''}
                    <div class="overlay__hint">Tap to continue</div>
                </div>`;
            return this.showOverlay(html);
        },

        settlement(report) {
            const total = report.reports.reduce((s, r) => s + r.qiDelta, 0);
            let i = 0;
            const days = report.reports.map((r) => `
                <div class="ledger__day">
                    <span class="ledger__date">${esc(CS.fmt.shortDate(r.date))}</span>
                    <span class="seal ${r.verdict === 'cleared' ? 'seal--jade' : r.verdict === 'poor' ? '' : 'seal--mist'}">${esc(r.verdict)}</span>
                </div>
                <ul class="ledger">
                    ${r.lines.map((l) => `<li class="${l.kind}" style="--i:${i++}">${esc(l.text)}</li>`).join('')}
                </ul>`).join('');
            const html = `
                <div class="overlay__panel fx-settle" data-fx="settle">
                    <div class="fx-settle__head">Daily Reckoning</div>
                    ${days}
                    <div class="fx-settle__total ${total > 0 ? 'positive' : total < 0 ? 'negative' : ''}">${total > 0 ? '+' : ''}${total} Qi</div>
                    <button class="btn btn--primary btn--block" data-action="dismiss-overlay">Continue cultivating</button>
                </div>`;
            return this.showOverlay(html);
        },
    };

    CS.fx = fx;
})(typeof window !== 'undefined' ? window : globalThis);
