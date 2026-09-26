(function (root) {
    const CS = (root.CS = root.CS || {});
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const sheet = {
        app: null,
        el: null,
        editingId: null,
        fields: null,

        init(app) {
            this.app = app;
            this.el = document.getElementById('sheet');
            this.el.addEventListener('click', (e) => {
                if (e.target === this.el) this.close();
            });
        },

        open({ task, date, slot } = {}) {
            const G = CS.Game;
            const today = G.todayKey();
            this.editingId = task ? task.id : null;
            const base = task || {
                title: '',
                note: '',
                realm: 'mundane',
                duration: 30,
                date: date || this.app.state.date || today,
                slot: slot || ((date || this.app.state.date) === today ? G.currentSlot().id : 'morning'),
                deadline: null,
                repeat: null,
            };
            this.fields = {
                title: base.title,
                note: base.note,
                realm: base.realm,
                duration: base.duration,
                date: base.date,
                slot: base.slot,
                deadline: base.deadline ? { ...base.deadline } : null,
                repeat: base.repeat,
            };
            this.wasQi = task ? task.difficulty.qi : null;
            this.render();
            this.el.hidden = true;
            this.el.hidden = false;
            this.app.setFabVisible(false);
            const title = this.el.querySelector('#f-title');
            if (title && !task) setTimeout(() => title.focus(), 50);
        },

        close() {
            this.el.hidden = true;
            this.el.innerHTML = '';
            this.editingId = null;
            this.app.setFabVisible(this.app.state.view !== 'cultivation');
        },

        isOpen() {
            return this.el && !this.el.hidden;
        },

        render() {
            const G = CS.Game;
            const f = this.fields;
            const rating = G.rateTask(f);
            const chip = (name, value, current, label, icon) =>
                `<button type="button" class="chip ${String(current) === String(value) ? 'is-active' : ''}" data-field="${name}" data-value="${esc(value)}">${icon ? CS.icon(icon) : ''}${esc(label)}</button>`;
            const dots = Array.from({ length: 5 }, (_, i) => `<i class="${i < rating.tier ? 'on' : ''}"></i>`).join('');

            this.el.innerHTML = `
                <form class="sheet__panel" id="taskForm" novalidate>
                    <div class="sheet__head">
                        <h2 class="sheet__title" id="sheetTitle">${this.editingId ? 'Refine the task' : 'Inscribe a task'}</h2>
                        <button type="button" class="icon-btn" data-sheet="close" aria-label="Close">${CS.icon('close')}</button>
                    </div>
                    <div class="sheet__body">
                        <div class="field">
                            <label class="label" for="f-title">What will you cultivate?</label>
                            <input class="input" id="f-title" name="title" type="text" maxlength="120" placeholder="Morning meditation, study for the exam..." value="${esc(f.title)}" autocomplete="off">
                        </div>

                        <div class="rating" aria-live="polite">
                            <span class="dots dots--lg ${rating.tier === 5 ? 'dots--t5' : ''}" aria-label="Difficulty ${rating.tier} of 5">${dots}</span>
                            <span class="rating__tier">${esc(rating.name)}</span>
                            <span class="rating__qi tabular">${rating.qi}<small>Qi</small></span>
                            <div class="rating__breakdown">
                                ${rating.breakdown.map((b) => `<span>${esc(b.label)} ${esc(b.value)}</span>`).join('')}
                                ${rating.keywords.map((k) => `<span class="kw-${k.kind}">${esc(k.word)}</span>`).join('')}
                            </div>
                            ${this.wasQi !== null && this.wasQi !== rating.qi ? `<div class="rating__was">Was ${this.wasQi} Qi</div>` : ''}
                        </div>

                        <div class="field">
                            <span class="label">Realm</span>
                            <div class="chip-row">
                                ${Object.values(G.REALMS).map((r) => chip('realm', r.id, f.realm, r.name, r.id)).join('')}
                            </div>
                        </div>

                        <div class="field">
                            <span class="label">Time it will take</span>
                            <div class="chip-row">
                                ${G.DURATIONS.map((d) => chip('duration', d.minutes, f.duration, d.label)).join('')}
                            </div>
                        </div>

                        <div class="field-row">
                            <div class="field">
                                <label class="label" for="f-date">Day</label>
                                <input class="input" id="f-date" name="date" type="date" value="${esc(f.date)}">
                            </div>
                            <div class="field">
                                <span class="label">Repeats</span>
                                <div class="chip-row">
                                    ${chip('repeat', '', f.repeat || '', 'Once')}
                                    ${chip('repeat', 'daily', f.repeat || '', 'Daily')}
                                    ${chip('repeat', 'weekly', f.repeat || '', 'Weekly')}
                                </div>
                            </div>
                        </div>

                        <div class="field">
                            <span class="label">Part of the day</span>
                            <div class="chip-row">
                                ${G.SLOTS.map((s) => chip('slot', s.id, f.slot, s.name, s.id)).join('')}
                            </div>
                        </div>

                        <div class="field">
                            <div class="chip-row">
                                <button type="button" class="chip ${f.deadline ? 'is-active' : ''}" data-sheet="toggle-deadline">${CS.icon('clock')}${f.deadline ? 'Has a deadline' : 'Add a deadline'}</button>
                            </div>
                            ${f.deadline ? `
                                <div class="field-row" style="margin-top: var(--s2)">
                                    <div class="field">
                                        <label class="label" for="f-deadline-date">Due on</label>
                                        <input class="input" id="f-deadline-date" name="deadlineDate" type="date" value="${esc(f.deadline.date || '')}" min="${esc(f.date)}">
                                    </div>
                                    <div class="field">
                                        <label class="label" for="f-deadline-time">Due at (optional)</label>
                                        <input class="input" id="f-deadline-time" name="deadlineTime" type="time" value="${esc(f.deadline.time || '')}">
                                    </div>
                                </div>` : ''}
                        </div>

                        <div class="field">
                            <label class="label" for="f-note">Notes</label>
                            <textarea class="input" id="f-note" name="note" maxlength="500" placeholder="Anything to remember">${esc(f.note)}</textarea>
                        </div>

                        <div class="form-error" id="f-error">${rating.invalidDeadline ? 'The deadline cannot be before the task day.' : ''}</div>

                        <div class="sheet__actions">
                            <button type="button" class="btn btn--ghost" data-sheet="close">Cancel</button>
                            <button type="submit" class="btn btn--primary">${this.editingId ? 'Refine' : 'Inscribe'}</button>
                        </div>
                    </div>
                </form>`;

            const form = this.el.querySelector('#taskForm');
            form.addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
            form.addEventListener('input', (e) => this.onInput(e));
            form.addEventListener('click', (e) => this.onClick(e));
        },

        readInputs() {
            const q = (id) => this.el.querySelector(id);
            const f = this.fields;
            f.title = q('#f-title').value;
            f.note = q('#f-note').value;
            f.date = q('#f-date').value || f.date;
            if (f.deadline) {
                f.deadline.date = q('#f-deadline-date').value || f.deadline.date || f.date;
                f.deadline.time = q('#f-deadline-time').value || null;
            }
        },

        onInput(e) {
            this.readInputs();
            if (e.target.id === 'f-title' || e.target.id === 'f-note') {
                this.refreshRating();
            } else {
                this.rerenderKeepingFocus();
            }
        },

        onClick(e) {
            const chipEl = e.target.closest('[data-field]');
            if (chipEl) {
                this.readInputs();
                const name = chipEl.dataset.field;
                const value = chipEl.dataset.value;
                if (name === 'duration') this.fields.duration = Number(value);
                else if (name === 'repeat') this.fields.repeat = value || null;
                else this.fields[name] = value;
                this.rerenderKeepingFocus();
                return;
            }
            const action = e.target.closest('[data-sheet]');
            if (!action) return;
            if (action.dataset.sheet === 'close') this.close();
            if (action.dataset.sheet === 'toggle-deadline') {
                this.readInputs();
                this.fields.deadline = this.fields.deadline ? null : { date: this.fields.date, time: null };
                this.rerenderKeepingFocus();
            }
        },

        refreshRating() {
            const G = CS.Game;
            const rating = G.rateTask(this.fields);
            const box = this.el.querySelector('.rating');
            if (!box) return;
            box.querySelector('.dots').className = `dots dots--lg ${rating.tier === 5 ? 'dots--t5' : ''}`;
            box.querySelector('.dots').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < rating.tier ? 'on' : ''}"></i>`).join('');
            box.querySelector('.rating__tier').textContent = rating.name;
            box.querySelector('.rating__qi').innerHTML = `${rating.qi}<small>Qi</small>`;
            box.querySelector('.rating__breakdown').innerHTML =
                rating.breakdown.map((b) => `<span>${esc(b.label)} ${esc(b.value)}</span>`).join('') +
                rating.keywords.map((k) => `<span class="kw-${k.kind}">${esc(k.word)}</span>`).join('');
        },

        rerenderKeepingFocus() {
            const active = document.activeElement && document.activeElement.id;
            const panel = this.el.querySelector('.sheet__panel');
            const scroll = panel ? panel.scrollTop : 0;
            this.render();
            const next = this.el.querySelector('.sheet__panel');
            if (next) { next.style.animation = 'none'; next.scrollTop = scroll; }
            if (active) { const el = this.el.querySelector('#' + active); if (el) el.focus(); }
        },

        submit() {
            this.readInputs();
            const error = this.app.saveTaskFromSheet(this.fields, this.editingId);
            if (error) {
                const box = this.el.querySelector('#f-error');
                if (box) box.textContent = error;
                return;
            }
            this.close();
        },
    };

    CS.sheet = sheet;
})(typeof window !== 'undefined' ? window : globalThis);
