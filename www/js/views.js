(function (root) {
    const CS = (root.CS = root.CS || {});
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    CS.esc = esc;

    const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const WD_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const fmt = {
        weekday(key) { return WEEKDAYS[(CS.Game.parseKey(key).getDay() + 6) % 7]; },
        longDate(key) { const d = CS.Game.parseKey(key); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; },
        shortDate(key) { const d = CS.Game.parseKey(key); return `${WEEKDAYS[(d.getDay() + 6) % 7].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; },
        monthName(monthKey) { const [y, m] = monthKey.split('-').map(Number); return { name: MONTHS[m - 1], year: y }; },
        relative(key, today) {
            const diff = CS.Game.daysBetween(today, key);
            if (diff === 0) return 'Today';
            if (diff === 1) return 'Tomorrow';
            if (diff === -1) return 'Yesterday';
            return diff < 0 ? `${-diff} days ago` : `In ${diff} days`;
        },
        hours(slot) { const h = (n) => `${String(n % 24).padStart(2, '0')}:00`; return `${h(slot.start)}–${h(slot.end)}`; },
        time(iso) { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; },
        countdown(iso, now) {
            const ms = new Date(iso).getTime() - (now || Date.now());
            if (ms <= 0) return 'now';
            const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
            return h > 0 ? `${h}h ${m}m` : `${m}m`;
        },
    };
    CS.fmt = fmt;

    const dots = (tier, cls) => `<span class="dots ${cls || ''} ${tier === 5 ? 'dots--t5' : ''}" aria-label="Difficulty ${tier} of 5">${Array.from({ length: 5 }, (_, i) => `<i class="${i < tier ? 'on' : ''}"></i>`).join('')}</span>`;

    function mondayOf(key) {
        const d = CS.Game.parseKey(key);
        const offset = (d.getDay() + 6) % 7;
        return CS.Game.addDays(key, -offset);
    }

    function taskRow(app, task, today) {
        const G = CS.Game;
        const late = !task.completed && task.date < today;
        const dueOver = task.deadline && !task.completed && task.deadline.date < today;
        const confirm = app.state.confirmDeleteId === task.id;
        const classes = ['task', task.completed && 'is-done', task.missed && 'is-missed', late && 'is-late', app.state.justCompletedId === task.id && 'just-done'].filter(Boolean).join(' ');
        return `
            <article class="${classes}" data-id="${task.id}">
                <button class="task__check" data-action="complete" data-id="${task.id}" ${task.completed ? 'disabled aria-label="Completed"' : 'aria-label="Complete task"'}>${CS.icon('check')}</button>
                <button class="task__body" data-action="edit" data-id="${task.id}">
                    <div class="task__title">${esc(task.title)}</div>
                    <div class="task__meta">
                        ${dots(task.difficulty.tier)}
                        <span class="task__qi tabular">${task.completed ? `+${task.awarded}` : task.difficulty.qi} Qi</span>
                        <span class="task__realm" title="${esc(G.REALMS[task.realm].name)}">${CS.icon(task.realm)}</span>
                        ${task.repeat ? `<span title="Repeats ${task.repeat}">${CS.icon('repeat')}</span>` : ''}
                        ${task.deadline ? `<span class="badge badge--due ${dueOver || task.missed ? 'is-over' : ''}">${CS.icon('clock')}${task.missed ? 'missed' : 'due'} ${esc(fmt.shortDate(task.deadline.date))}${task.deadline.time ? ' ' + esc(task.deadline.time) : ''}</span>` : ''}
                        ${late && !task.missed ? '<span class="badge badge--late">late · half Qi</span>' : ''}
                    </div>
                    ${task.note ? `<div class="task__note">${esc(task.note)}</div>` : ''}
                </button>
                <div class="task__actions">
                    <button class="icon-btn" data-action="delete" data-id="${task.id}" aria-label="Delete task">${CS.icon('trash')}</button>
                </div>
                ${confirm ? `
                    <div class="task__confirm">
                        <span>Remove this task?${task.completed ? ' Its Qi stays with you.' : ''}</span>
                        <div>
                            <button class="btn btn--sm btn--ghost" data-action="delete-cancel">Keep</button>
                            <button class="btn btn--sm btn--danger" data-action="delete-confirm" data-id="${task.id}">Remove</button>
                        </div>
                    </div>` : ''}
            </article>`;
    }

    function weekStrip(app, key, today) {
        const G = CS.Game;
        const start = mondayOf(key);
        const days = Array.from({ length: 7 }, (_, i) => G.addDays(start, i));
        return `
            <div class="strip">
                <button class="strip__nav" data-action="strip-prev" aria-label="Previous week">${CS.icon('chevronLeft')}</button>
                ${days.map((d, i) => {
                    const tasks = G.tasksOn(app.data, d);
                    const h = app.data.history[d];
                    const marks = h
                        ? `<i class="verdict-${h.verdict}"></i>`
                        : tasks.slice(0, 3).map((t) => `<i class="${t.completed ? 'done' : ''}"></i>`).join('');
                    const cls = ['strip__day', d === today && 'is-today', d === key && 'is-selected'].filter(Boolean).join(' ');
                    return `<button class="${cls}" data-action="pick-date" data-date="${d}" aria-label="${esc(fmt.longDate(d))}">
                        <span class="strip__wd">${WD_SHORT[i]}</span>
                        <span class="strip__num">${G.parseKey(d).getDate()}</span>
                        <span class="strip__marks">${marks}</span>
                    </button>`;
                }).join('')}
                <button class="strip__nav" data-action="strip-next" aria-label="Next week">${CS.icon('chevronRight')}</button>
            </div>`;
    }

    function today(app) {
        const G = CS.Game;
        const key = app.state.date;
        const todayKey = G.todayKey();
        const tasks = G.tasksOn(app.data, key);
        const planned = tasks.reduce((s, t) => s + t.difficulty.qi, 0);
        const earned = tasks.filter((t) => t.completed).reduce((s, t) => s + (t.awarded || 0), 0);
        const done = tasks.filter((t) => t.completed).length;
        const isToday = key === todayKey;
        const cur = isToday ? G.currentSlot().id : null;
        const hour = new Date().getHours();

        const slots = G.SLOTS.map((slot) => {
            const list = tasks.filter((t) => t.slot === slot.id);
            const ended = key < todayKey || (isToday && slot.id !== 'night' && hour >= slot.end);
            const slotQi = list.reduce((s, t) => s + t.difficulty.qi, 0);
            const slotEarned = list.filter((t) => t.completed).reduce((s, t) => s + (t.awarded || 0), 0);
            const cls = ['slot', slot.id === cur && 'is-current', ended && 'is-past'].filter(Boolean).join(' ');
            return `
                <section class="${cls}" data-slot="${slot.id}">
                    <header class="slot__head">
                        <span class="slot__icon">${CS.icon(slot.id)}</span>
                        <div>
                            <div class="slot__name">${slot.name}<span class="slot__epithet">${slot.epithet}</span></div>
                            <div class="slot__hours label">${fmt.hours(slot)}</div>
                        </div>
                        <span class="slot__qi tabular">${list.length ? `${slotEarned ? `+${slotEarned} / ` : ''}${slotQi} Qi` : ''}</span>
                        <button class="icon-btn" data-action="open-sheet" data-slot="${slot.id}" data-date="${key}" aria-label="Add a task to ${slot.name}">${CS.icon('plus')}</button>
                    </header>
                    ${list.length
                        ? `<div class="slot__list">${list.map((t) => taskRow(app, t, todayKey)).join('')}</div>`
                        : `<button class="slot__quiet" data-action="open-sheet" data-slot="${slot.id}" data-date="${key}">quiet</button>`}
                </section>`;
        }).join('');

        const debts = app.data.tasks.filter((t) => !t.completed && t.date < todayKey && t.date !== key);
        return `
            <section class="day">
                ${weekStrip(app, key, todayKey)}
                <header class="day-head">
                    <div>
                        <div class="day-head__rel">${esc(fmt.relative(key, todayKey))}</div>
                        <h1 class="day-head__name">${fmt.weekday(key)}</h1>
                        <div class="day-head__date">${fmt.longDate(key)}</div>
                    </div>
                    <div class="day-head__stats">
                        <div class="day-head__qi tabular">${earned}<small> / ${planned} Qi</small></div>
                        <div class="label">${done} of ${tasks.length} done</div>
                    </div>
                </header>
                <div class="day-bar">
                    <div class="ink-bar"><div class="ink-bar__fill" style="width:${planned ? Math.min(100, Math.round((earned / planned) * 100)) : 0}%"></div></div>
                </div>
                ${tasks.length === 0 ? `
                    <div class="empty">
                        <div class="empty__glyph">${CS.icon('lotus')}</div>
                        <div class="empty__title">An unwritten day</div>
                        <p>Tap a part of the day below, or the brush, to inscribe your first task.</p>
                    </div>` : ''}
                ${slots}
                ${debts.length && isToday ? `
                    <section class="card card--plain day-debt">
                        <div class="label">Unsettled debts</div>
                        <p class="muted" style="margin-top:6px;font-size:var(--fs-small)">${debts.length} unfinished task${debts.length > 1 ? 's' : ''} from past days. Late cultivation earns half Qi; deadlines already missed cost Qi at each reckoning.</p>
                        <div class="chip-row" style="margin-top:var(--s2)">
                            ${[...new Set(debts.map((t) => t.date))].slice(0, 6).map((d) => `<button class="chip chip--sm chip--danger" data-action="pick-date" data-date="${d}">${esc(fmt.shortDate(d))}</button>`).join('')}
                        </div>
                    </section>` : ''}
            </section>`;
    }

    function calendar(app) {
        const G = CS.Game;
        const todayKey = G.todayKey();
        const [y, m] = app.state.month.split('-').map(Number);
        const first = new Date(y, m - 1, 1);
        const lead = (first.getDay() + 6) % 7;
        const start = G.addDays(G.dateKey(first), -lead);
        const cells = [];
        let cleared = 0, poor = 0, doneCount = 0, qiNet = 0;
        for (let i = 0; i < 42; i++) {
            const key = G.addDays(start, i);
            const d = G.parseKey(key);
            const inMonth = d.getMonth() === m - 1;
            const tasks = G.tasksOn(app.data, key);
            const h = app.data.history[key];
            if (inMonth && h) {
                if (h.verdict === 'cleared') cleared++;
                if (h.verdict === 'poor') poor++;
                doneCount += h.done;
                qiNet += (h.qiEarned || 0) - (h.qiLost || 0);
            }
            const hasDue = tasks.some((t) => t.deadline && t.deadline.date === key && !t.completed);
            const openPast = key < todayKey && tasks.some((t) => !t.completed);
            const cls = ['cal__cell', !inMonth && 'is-other', key === todayKey && 'is-today', key === app.state.date && 'is-selected', openPast && 'is-past-open'].filter(Boolean).join(' ');
            cells.push(`
                <button class="${cls}" data-action="pick-date" data-date="${key}" aria-label="${esc(fmt.longDate(key))}, ${tasks.length} tasks">
                    <span class="cal__num">${d.getDate()}</span>
                    <span class="cal__dots">${tasks.slice(0, 3).map((t) => `<i class="t${t.difficulty.tier} ${t.completed ? 'done' : ''}"></i>`).join('')}</span>
                    ${h && h.planned > 0 ? `<span class="cal__seal cal__seal--${h.verdict}"></span>` : ''}
                    ${hasDue ? '<span class="cal__due"></span>' : ''}
                </button>`);
            if (i >= 34 && G.parseKey(G.addDays(start, i + 1)).getMonth() !== m - 1 && (i + 1) % 7 === 0) break;
        }
        const { name, year } = fmt.monthName(app.state.month);
        return `
            <section class="cal">
                <header class="cal__head">
                    <button class="icon-btn" data-action="month-prev" aria-label="Previous month">${CS.icon('chevronLeft')}</button>
                    <div class="cal__month"><h1 class="cal__month-name">${name}</h1><div class="cal__year">${year}</div></div>
                    <button class="icon-btn" data-action="month-next" aria-label="Next month">${CS.icon('chevronRight')}</button>
                </header>
                <div class="cal__grid">
                    ${WD_SHORT.map((w) => `<span class="cal__wd">${w}</span>`).join('')}
                    ${cells.join('')}
                </div>
                <div class="cal__legend">
                    <span><i style="background:var(--jade)"></i>Cleared</span>
                    <span><i style="background:var(--cinnabar)"></i>Punished</span>
                    <span><i style="background:#5d574c"></i>Half-measures</span>
                    <span><i style="background:var(--cinnabar-light);border-radius:50%"></i>Deadline</span>
                </div>
                <div class="cal__summary">
                    <div class="stat"><div class="stat__v jade">${cleared}</div><div class="stat__l label">Cleared</div></div>
                    <div class="stat"><div class="stat__v cinnabar">${poor}</div><div class="stat__l label">Punished</div></div>
                    <div class="stat"><div class="stat__v gold">${qiNet > 0 ? '+' : ''}${qiNet}</div><div class="stat__l label">Qi settled</div></div>
                </div>
            </section>`;
    }

    function cultivation(app) {
        const G = CS.Game;
        const d = app.data;
        const now = Date.now();
        const stage = G.stageFor(d);
        const next = G.nextStage(d);
        const state = G.tribulationState(d, now);
        const floor = stage.minQi;
        const ceil = next ? next.minQi : stage.minQi;
        const progress = next ? Math.min(1, Math.max(0, (d.qi - floor) / (ceil - floor))) : 1;
        const C = 2 * Math.PI * 88;

        let trib;
        if (state.status === 'max') {
            trib = `<div class="trib__status"><span class="trib__glyph trib__glyph--gold">${CS.icon('star')}</span><div><div class="card__title" style="margin:0">Peak of the Dao</div><p class="muted" style="font-size:var(--fs-small)">No further heavens remain to be defied. Keep the routine that carried you here.</p></div></div>`;
        } else if (state.status === 'locked') {
            trib = `<div class="trib__status"><span class="trib__glyph trib__glyph--mist">${CS.icon('gate')}</span><div><div class="card__title" style="margin:0">${esc(state.target.name)} lies ahead</div><p class="muted" style="font-size:var(--fs-small)">Gather <b class="tabular" style="color:var(--gold-light)">${state.needQi}</b> more Qi to summon the Heavenly Tribulation.</p></div></div>`;
        } else if (state.status === 'regained') {
            trib = `<div class="trib__status"><span class="trib__glyph trib__glyph--mist">${CS.icon('gate')}</span><div><div class="card__title" style="margin:0">Foundation cracked</div><p class="muted" style="font-size:var(--fs-small)">You once stood at ${esc(state.target.name)}. Regain <b class="tabular" style="color:var(--gold-light)">${state.needQi}</b> Qi and it is restored without another tribulation.</p></div></div>`;
        } else if (state.status === 'cooldown') {
            trib = `<div class="trib__status"><span class="trib__glyph">${CS.icon('lightning')}</span><div><div class="card__title" style="margin:0">The heavens are closed</div><p class="muted" style="font-size:var(--fs-small)">Meditate. You may face the tribulation for ${esc(state.target.name)} again in <b class="tabular" style="color:var(--thunder)">${fmt.countdown(state.cooldownUntil, now)}</b>.</p></div></div>`;
        } else {
            trib = `
                <div class="trib__status">
                    <span class="trib__glyph">${CS.icon('lightning')}</span>
                    <div>
                        <div class="card__title" style="margin:0">Heavenly Tribulation awaits</div>
                        <div class="trib__chance tabular">${Math.round(state.chance * 100)}%<small>to break through to ${esc(state.target.name)}</small></div>
                    </div>
                </div>
                <ul class="trib__parts">
                    ${state.parts.map((p) => `<li class="${p.value < 0 ? 'neg' : ''}"><span>${esc(p.label)}</span><b>${p.value >= 0 ? '+' : ''}${Math.round(p.value * 100)}%</b></li>`).join('')}
                </ul>
                ${state.hints.length ? `<ul class="trib__hints">${state.hints.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
                <div class="trib__cta"><button class="btn btn--primary btn--block" data-action="face-tribulation">${CS.icon('lightning')} Face the Tribulation</button></div>`;
        }

        const path = G.STAGES.map((s, i) => {
            const passed = d.tribulation.passedStages.includes(i) && i <= stage.index;
            const cls = ['path__step', i < stage.index && 'is-passed', i === stage.index && 'is-current', state.status === 'ready' && next && i === next.index && 'is-ready'].filter(Boolean).join(' ');
            const labelled = i === stage.index || (next && i === next.index);
            return `<div class="${cls}" title="${esc(s.name)}"><span class="path__dot">${passed && i < stage.index ? CS.icon('check') : i + 1}</span><span class="path__name">${labelled ? esc(s.short) : ''}</span></div>`;
        }).join('');

        const allTitles = [
            ...G.STAGES.slice(1).map((s) => ({ title: s.title, hint: `Break through to ${s.name}` })),
            ...G.TITLE_RULES.map((r) => ({ title: r.title, hint: r.hint })),
        ];
        const earned = allTitles.filter((t) => d.titles.includes(t.title));
        const locked = allTitles.filter((t) => !d.titles.includes(t.title));

        const log = (d.log || []).slice(0, 30);
        const report = d.lastSettlementReport;

        return `
            <section class="cult">
                <div class="hero">
                    <div class="hero__ring">
                        <svg viewBox="0 0 200 200" aria-hidden="true">
                            <defs><linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8c877"/><stop offset="1" stop-color="#a8853a"/></linearGradient></defs>
                            <circle class="track" cx="100" cy="100" r="88"/>
                            <circle class="prog" cx="100" cy="100" r="88" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - progress)).toFixed(1)}"/>
                        </svg>
                        <div class="hero__center">
                            <div class="hero__qi gold-text tabular">${d.qi}</div>
                            <div class="hero__unit">Qi</div>
                        </div>
                    </div>
                    <h1 class="hero__stage">${esc(stage.name)}</h1>
                    <div class="hero__title">${esc(stage.title)}</div>
                    <div class="hero__next">${next ? `${Math.max(0, next.minQi - d.qi)} Qi to ${esc(next.name)}` : 'The summit of cultivation'}${d.streak.current ? ` · ${d.streak.current}-day streak` : ''}${G.deviationActive(d, now) ? ` · <span style="color:var(--cinnabar-light)">Qi Deviation until ${esc(d.deviation.until)}</span>` : ''}</div>
                </div>

                <section class="card trib">${trib}</section>

                <section class="section-gap">
                    <div class="label">The path</div>
                    <div class="path">${path}</div>
                </section>

                <section class="section-gap">
                    <div class="label">Titles · ${earned.length} of ${allTitles.length}</div>
                    <div class="titles">
                        ${earned.map((t) => `<span class="seal seal--lg">${esc(t.title)}</span>`).join('')}
                        ${locked.slice(0, 6).map((t) => `<span class="title-lock"><span class="seal seal--ghost">${esc(t.title)}</span><small>${esc(t.hint)}</small></span>`).join('')}
                        ${locked.length > 6 ? `<span class="title-lock"><span class="seal seal--ghost">+${locked.length - 6} more</span></span>` : ''}
                    </div>
                </section>

                ${report ? `
                    <section class="card card--plain section-gap">
                        <div class="label">Last reckoning · ${esc(fmt.shortDate(report.settledOn))}</div>
                        ${report.reports.map((r) => `
                            <div class="ledger__day"><span class="ledger__date">${esc(fmt.shortDate(r.date))}</span><span class="seal ${r.verdict === 'cleared' ? 'seal--jade' : r.verdict === 'poor' ? '' : 'seal--mist'}">${esc(r.verdict)}</span></div>
                            <ul class="ledger">${r.lines.map((l) => `<li class="${l.kind}">${esc(l.text)}</li>`).join('')}</ul>`).join('')}
                    </section>` : ''}

                <section class="section-gap">
                    <div class="label">Chronicle</div>
                    ${log.length ? `<ul class="chron">${log.map((e) => `<li class="${e.type}"><time>${esc(fmt.time(e.at))}</time>${esc(e.message)}</li>`).join('')}</ul>` : `<p class="muted" style="margin-top:var(--s2);font-size:var(--fs-small)">Your chronicle is blank. Complete a task to write the first line.</p>`}
                </section>
            </section>`;
    }

    CS.views = { today, calendar, cultivation, taskRow };
})(typeof window !== 'undefined' ? window : globalThis);
