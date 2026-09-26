(function (root) {
    const CS = (root.CS = root.CS || {});
    const STORAGE_KEY = 'cultivationData';

    CS.localStore = {
        load() {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (error) { return null; }
        },
        save(data) {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (error) { /* storage unavailable */ }
        },
    };

    class CultivationScheduleApp {
        constructor(data, store) {
            const G = CS.Game;
            this.store = store || CS.localStore;
            this.data = G.migrate(data === undefined ? this.store.load() : data);
            const today = G.todayKey();
            this.state = { view: 'today', date: today, month: today.slice(0, 7), justCompletedId: null, confirmDeleteId: null };
            this.init();
        }

        saveData() {
            this.store.save(this.data);
        }

        init() {
            document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = CS.icon(el.dataset.icon); });
            CS.fx.init();
            CS.sheet.init(this);
            CS.art.init();

            const rootEl = document.getElementById('root');
            rootEl.addEventListener('click', (e) => this.onClick(e));
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (CS.sheet.isOpen()) CS.sheet.close();
                    else if (!document.getElementById('overlay').hidden) this.dismissOverlay();
                }
            });
            document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.onVisible(); });

            const settled = this.runSettlement();
            this.saveData();
            this.render();
            if (settled) this.showSettlement();
            else if (this.data.lastSettlementReport && !this.data.lastSettlementReport.seen) this.showSettlement();
        }

        runSettlement() {
            const { reports } = CS.Game.settle(this.data, Date.now());
            return reports.length > 0;
        }

        onVisible() {
            Promise.resolve(this.store.load()).then((raw) => {
                if (raw) this.data = CS.Game.migrate(raw);
                const settled = this.runSettlement();
                if (settled) this.saveData();
                this.render();
                if (settled) this.showSettlement();
            });
        }

        showSettlement() {
            const report = this.data.lastSettlementReport;
            if (!report || !report.reports.length) return;
            report.seen = true;
            this.saveData();
            CS.fx.settlement(report).then(() => this.render());
        }

        // ---- rendering ----
        render() {
            const G = CS.Game;
            const view = document.getElementById('view');
            const stage = G.stageFor(this.data);

            document.getElementById('stageName').textContent = stage.name;
            document.getElementById('stageSeal').textContent = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][stage.index];
            const qiEl = document.getElementById('qiValue');
            const prev = Number(qiEl.textContent) || 0;
            if (prev !== this.data.qi) {
                CS.fx.tweenNumber(qiEl, prev, this.data.qi, 600);
                CS.fx.pulse(document.getElementById('qiPill'));
            }
            CS.art.setStage(stage.index);

            document.querySelectorAll('#nav [data-view]').forEach((b) => b.classList.toggle('is-active', b.dataset.view === this.state.view));
            this.setFabVisible(this.state.view !== 'cultivation' && !CS.sheet.isOpen());

            const changedView = view.dataset.view !== this.state.view;
            view.innerHTML = CS.views[this.state.view](this);
            view.dataset.view = this.state.view;
            if (changedView) {
                view.classList.remove('is-entering');
                void view.offsetWidth;
                view.classList.add('is-entering');
                view.scrollIntoView({ block: 'start' });
                window.scrollTo(0, 0);
            }
            this.state.justCompletedId = null;
        }

        setFabVisible(visible) {
            document.getElementById('fab').hidden = !visible;
        }

        // ---- events ----
        onClick(e) {
            const target = e.target.closest('[data-action]');
            const overlay = document.getElementById('overlay');
            if (!target) {
                const panel = e.target.closest('[data-fx]');
                if (panel && panel.dataset.dismissable === 'true') this.dismissOverlay();
                return;
            }
            const { action } = target.dataset;
            const id = target.dataset.id ? Number(target.dataset.id) : null;
            switch (action) {
                case 'nav': this.setView(target.dataset.view); break;
                case 'pick-date': this.state.date = target.dataset.date; this.setView('today'); break;
                case 'strip-prev': this.state.date = CS.Game.addDays(this.state.date, -7); this.render(); break;
                case 'strip-next': this.state.date = CS.Game.addDays(this.state.date, 7); this.render(); break;
                case 'month-prev': this.shiftMonth(-1); break;
                case 'month-next': this.shiftMonth(1); break;
                case 'open-sheet': CS.sheet.open({ date: target.dataset.date || this.state.date, slot: target.dataset.slot }); break;
                case 'edit': this.state.confirmDeleteId = null; CS.sheet.open({ task: this.data.tasks.find((t) => t.id === id) }); break;
                case 'complete': this.complete(id, target); break;
                case 'delete': this.state.confirmDeleteId = id; this.render(); break;
                case 'delete-cancel': this.state.confirmDeleteId = null; this.render(); break;
                case 'delete-confirm': this.removeTask(id); break;
                case 'face-tribulation': this.faceTribulation(); break;
                case 'dismiss-overlay': this.dismissOverlay(); break;
                default: break;
            }
            if (!overlay.hidden && action !== 'dismiss-overlay' && action !== 'face-tribulation') e.stopPropagation();
        }

        setView(view) {
            if (!CS.views[view]) return;
            if (view === 'calendar') this.state.month = this.state.date.slice(0, 7);
            this.state.view = view;
            this.state.confirmDeleteId = null;
            this.render();
        }

        shiftMonth(delta) {
            const [y, m] = this.state.month.split('-').map(Number);
            const d = new Date(y, m - 1 + delta, 1);
            this.state.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            this.render();
        }

        dismissOverlay() {
            CS.fx.dismiss();
        }

        // ---- task flows ----
        saveTaskFromSheet(fields, editingId) {
            const G = CS.Game;
            const result = editingId ? G.updateTask(this.data, editingId, fields, Date.now()) : G.addTask(this.data, fields, Date.now());
            if (result.error) return result.error;
            this.saveData();
            this.state.date = result.task.date;
            if (this.state.view === 'cultivation') this.state.view = 'today';
            this.render();
            CS.fx.toast(editingId ? 'Task refined.' : `Inscribed: ${result.task.difficulty.name}, ${result.task.difficulty.qi} Qi.`, 'positive');
            return null;
        }

        complete(id, buttonEl) {
            const G = CS.Game;
            const before = G.stageFor(this.data).index;
            const from = buttonEl ? buttonEl.getBoundingClientRect() : null;
            const to = document.getElementById('qiPill').getBoundingClientRect();
            const result = G.completeTask(this.data, id, Date.now());
            if (!result.gained) return;
            this.saveData();
            this.state.justCompletedId = id;
            CS.fx.burst(from, to, 8 + Math.min(10, Math.round(result.gained / 4)));
            this.render();
            for (const ev of result.events) {
                if (ev.kind === 'title' || ev.kind === 'stage-up' || ev.kind === 'stage-down') CS.fx.toast(ev.message, ev.type);
            }
            const after = G.stageFor(this.data).index;
            if (after !== before) CS.art.setStage(after);
        }

        removeTask(id) {
            CS.Game.deleteTask(this.data, id);
            this.state.confirmDeleteId = null;
            this.saveData();
            this.render();
        }

        faceTribulation() {
            const G = CS.Game;
            const state = G.tribulationState(this.data, Date.now());
            if (state.status !== 'ready') return;
            const target = state.target;
            const result = G.resolveTribulation(this.data, Date.now(), Math.random);
            this.saveData();
            const titleEvent = result.events.find((ev) => ev.kind === 'title');
            CS.fx.tribulation({
                success: result.success,
                stage: target.name,
                chance: result.chance,
                qi: this.data.qi,
                bonus: result.success ? Math.round(target.minQi * 0.1) : 0,
                title: titleEvent && result.success ? target.title : null,
            }).then(() => this.render());
            this.render();
        }
    }

    CS.CultivationScheduleApp = CultivationScheduleApp;

    document.addEventListener('DOMContentLoaded', () => {
        root.app = new CultivationScheduleApp();
    });
})(typeof window !== 'undefined' ? window : globalThis);
