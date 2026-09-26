(function (root) {
    const CS = (root.CS = root.CS || {});

    const STAGES = [
        { name: 'Mortal', short: 'Mortal', minQi: 0, title: 'Mundane Wanderer' },
        { name: 'Qi Condensation', short: 'Condense', minQi: 150, title: 'Student of the Way' },
        { name: 'Foundation Establishment', short: 'Foundation', minQi: 500, title: "Cultivator's Pride" },
        { name: 'Core Formation', short: 'Core', minQi: 1200, title: 'Heart of the Dao' },
        { name: 'Nascent Soul', short: 'Nascent', minQi: 2200, title: "Heavens' Chosen" },
        { name: 'Soul Transformation', short: 'Soul', minQi: 3500, title: 'Celestial Being' },
        { name: 'Dao Ascension', short: 'Dao', minQi: 5000, title: 'Ruler of the Realms' },
    ];
    const V1_THRESHOLDS = [0, 50, 150, 300, 500, 800];

    const SLOTS = [
        { id: 'dawn', name: 'Dawn', epithet: 'Gathering Dew', start: 5, end: 8, mult: 1.25 },
        { id: 'morning', name: 'Morning', epithet: 'Rising Yang', start: 8, end: 12, mult: 1.0 },
        { id: 'noon', name: 'Noon', epithet: 'Zenith', start: 12, end: 14, mult: 0.95 },
        { id: 'afternoon', name: 'Afternoon', epithet: 'Waning Sun', start: 14, end: 18, mult: 1.0 },
        { id: 'dusk', name: 'Dusk', epithet: 'Returning Breath', start: 18, end: 21, mult: 1.05 },
        { id: 'night', name: 'Night', epithet: 'Stillness', start: 21, end: 29, mult: 1.1 },
    ];
    const SLOT_INDEX = Object.fromEntries(SLOTS.map((s, i) => [s.id, i]));

    const REALMS = {
        body: { id: 'body', name: 'Body', mult: 1.15 },
        mind: { id: 'mind', name: 'Mind', mult: 1.1 },
        spirit: { id: 'spirit', name: 'Spirit', mult: 1.2 },
        mundane: { id: 'mundane', name: 'Mundane', mult: 0.9 },
    };

    const DURATIONS = [
        { minutes: 15, base: 5, label: '15m' },
        { minutes: 30, base: 9, label: '30m' },
        { minutes: 60, base: 15, label: '1h' },
        { minutes: 120, base: 24, label: '2h' },
        { minutes: 240, base: 34, label: '4h+' },
    ];

    const TIERS = [
        { tier: 1, name: 'Mortal Chore', max: 7 },
        { tier: 2, name: 'Qi Refining', max: 14 },
        { tier: 3, name: 'Meridian Tempering', max: 24 },
        { tier: 4, name: 'Core Forging', max: 40 },
        { tier: 5, name: 'Heavenly Trial', max: 70 },
    ];

    const LEXICON = {
        hard: ['exam', 'deadline', 'presentation', 'interview', 'essay', 'thesis', 'report', 'project', 'marathon',
            'workout', 'gym', 'deadlift', 'sprint', 'hike', 'study', 'revise', 'memorize', 'practice', 'rehearse',
            'fast', 'meditate', 'write', 'code', 'debug', 'refactor', 'budget', 'taxes', 'negotiate', 'apply',
            'finish', 'submit', 'launch', 'build', 'train'],
        easy: ['email', 'call', 'text', 'check', 'reply', 'water', 'plants', 'tidy', 'quick', 'buy', 'order', 'book',
            'schedule', 'remind', 'browse', 'scroll', 'snack', 'coffee', 'tea', 'nap', 'watch', 'listen', 'print',
            'pay', 'pick', 'drop', 'sort', 'fold', 'skim', 'glance'],
        body: ['run', 'gym', 'lift', 'yoga', 'stretch', 'walk', 'hike', 'swim', 'bike', 'pushups', 'squats', 'cardio',
            'sleep', 'hydrate', 'cook', 'meal', 'protein', 'posture', 'sauna', 'cold', 'shower', 'bath', 'sprint',
            'climb', 'dance', 'rest', 'doctor', 'dentist', 'vitamins', 'workout', 'train'],
        mind: ['study', 'read', 'learn', 'course', 'lecture', 'essay', 'write', 'code', 'math', 'language', 'flashcards',
            'notes', 'research', 'plan', 'review', 'revise', 'exam', 'homework', 'practice', 'chess', 'puzzle',
            'article', 'book', 'paper', 'memorize', 'outline', 'debug', 'design', 'analyse', 'analyze', 'lesson'],
        spirit: ['meditate', 'meditation', 'breathe', 'breathing', 'journal', 'gratitude', 'pray', 'prayer', 'reflect',
            'mindful', 'silence', 'nature', 'sunrise', 'tea', 'ceremony', 'calm', 'forgive', 'family', 'friend',
            'volunteer', 'kindness', 'therapy', 'unplug', 'art', 'music', 'draw', 'paint', 'garden', 'temple', 'stillness'],
        mundane: ['chores', 'clean', 'laundry', 'dishes', 'groceries', 'shopping', 'bills', 'errands', 'bank', 'email',
            'admin', 'paperwork', 'trash', 'vacuum', 'mop', 'fix', 'repair', 'car', 'fuel', 'commute', 'appointment',
            'pharmacy', 'post', 'package', 'renew', 'insurance', 'rent', 'forms', 'print', 'tidy'],
    };

    const TITLE_RULES = [
        { title: 'Task Conqueror', hint: 'Complete 10 tasks', test: (d) => d.tasksCompleted >= 10 },
        { title: 'Disciplined Cultivator', hint: 'Complete 25 tasks', test: (d) => d.tasksCompleted >= 25 },
        { title: 'Path of Ascension', hint: 'Complete 50 tasks', test: (d) => d.tasksCompleted >= 50 },
        { title: 'Unshakeable Will', hint: 'Complete 100 tasks', test: (d) => d.tasksCompleted >= 100 },
        { title: 'Qi Warrior', hint: 'Hold 100 Qi', test: (d) => d.qi >= 100 },
        { title: 'Seven Suns', hint: 'Clear 7 days in a row', test: (d) => d.streak.best >= 7 },
        { title: 'Moon Cycle', hint: 'Clear 30 days in a row', test: (d) => d.streak.best >= 30 },
        { title: 'Dawn Treader', hint: 'Complete 25 tasks at dawn', test: (d) => d.counters.dawnDone >= 25 },
        { title: 'Lightning Eater', hint: 'Pass a tribulation at 50% or less', test: (d, ctx) => ctx.tribulationPassed && ctx.chance <= 0.5 },
        { title: 'Scarred Ascendant', hint: 'Pass a tribulation after two failures', test: (d, ctx) => ctx.tribulationPassed && ctx.attempts >= 2 },
        { title: 'Fourfold Balance', hint: 'Clear a day that touches all four realms', test: (d, ctx) => ctx.fourfoldDay === true },
    ];

    const STREAK_MILESTONES = { 3: 10, 7: 30, 14: 60, 30: 150 };
    const DAY_MS = 86400000;

    // ---- dates (all local) ----
    const pad = (n) => String(n).padStart(2, '0');
    const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const todayKey = (now) => dateKey(now ? new Date(now) : new Date());
    const parseKey = (key) => {
        const [y, m, d] = key.split('-').map(Number);
        return new Date(y, m - 1, d);
    };
    const addDays = (key, n) => {
        const d = parseKey(key);
        d.setDate(d.getDate() + n);
        return dateKey(d);
    };
    const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / DAY_MS);
    const slotFor = (hour) => (hour < 5 ? SLOTS[5] : SLOTS.find((s) => hour >= s.start && hour < s.end));
    const currentSlot = (now) => slotFor((now ? new Date(now) : new Date()).getHours());

    // ---- data ----
    function defaultData(now) {
        return {
            version: 2,
            qi: 0,
            tasksCompleted: 0,
            titles: [],
            nextId: 1,
            counters: { dawnDone: 0 },
            streak: { current: 0, best: 0, lastClearedDate: null },
            lastSettledDate: addDays(todayKey(now), -1),
            lastPoorDate: null,
            lastSettlementReport: null,
            deviation: { until: null },
            tribulation: { cooldownUntil: null, attempts: 0, passedStages: [0] },
            history: {},
            tasks: [],
            log: [],
        };
    }

    function tierFor(qi) {
        return TIERS.find((t) => qi <= t.max) || TIERS[TIERS.length - 1];
    }

    function migrate(raw, now) {
        if (!raw || typeof raw !== 'object') return defaultData(now);
        if (!raw.version) return migrateV1(raw, now);
        const base = defaultData(now);
        for (const key of Object.keys(base)) {
            if (raw[key] === undefined) raw[key] = base[key];
        }
        return raw;
    }

    function migrateV1(old, now) {
        const data = defaultData(now);
        const exp = old.exp || 0;
        let stageIdx = 0;
        for (let i = V1_THRESHOLDS.length - 1; i >= 0; i--) {
            if (exp >= V1_THRESHOLDS[i]) { stageIdx = i; break; }
        }
        data.qi = Math.max(old.qi || 0, STAGES[stageIdx].minQi);
        data.tasksCompleted = old.tasksCompleted || 0;
        data.titles = Array.isArray(old.titles) ? old.titles.slice() : [];
        data.tribulation.passedStages = Array.from({ length: stageIdx + 1 }, (_, i) => i);

        const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const today = todayKey(now);
        const todayIdx = (parseKey(today).getDay() + 6) % 7;
        const schedule = old.schedule || {};
        weekdays.forEach((day, idx) => {
            const date = addDays(today, (idx - todayIdx + 7) % 7);
            for (const t of schedule[day] || []) {
                const qi = Math.max(3, Math.min(70, Number(t.qi) || 10));
                const id = data.nextId++;
                data.tasks.push({
                    id,
                    seriesId: id,
                    title: String(t.title || 'Untitled'),
                    note: String(t.note || ''),
                    realm: 'mundane',
                    duration: 30,
                    date,
                    slot: 'morning',
                    deadline: null,
                    repeat: 'weekly',
                    difficulty: { tier: tierFor(qi).tier, name: tierFor(qi).name, qi, urgency: 1, breakdown: [], keywords: [] },
                    completed: Boolean(t.completed),
                    completedAt: null,
                    awarded: t.completed ? qi : 0,
                    missed: false,
                    createdAt: new Date(now || Date.now()).toISOString(),
                });
            }
        });
        return data;
    }

    // ---- stages ----
    function stageIndex(data) {
        let idx = 0;
        for (let i = 0; i < STAGES.length; i++) {
            if (data.qi >= STAGES[i].minQi && data.tribulation.passedStages.includes(i)) idx = i;
        }
        return idx;
    }
    const stageFor = (data) => ({ index: stageIndex(data), ...STAGES[stageIndex(data)] });
    const nextStage = (data) => {
        const i = stageIndex(data) + 1;
        return i < STAGES.length ? { index: i, ...STAGES[i] } : null;
    };

    function history7(data, today) {
        let planned = 0, done = 0;
        const realms = new Set();
        for (let i = 1; i <= 7; i++) {
            const h = data.history[addDays(today, -i)];
            if (!h) continue;
            planned += h.planned;
            done += h.done;
            for (const [realm, n] of Object.entries(h.realms || {})) if (n > 0) realms.add(realm);
        }
        return { planned, done, rate: planned >= 5 ? done / planned : 0.5, realms: realms.size };
    }

    const deviationActive = (data, now) => Boolean(data.deviation.until && todayKey(now) <= data.deviation.until);

    function tribulationChance(data, now) {
        const today = todayKey(now);
        const h = history7(data, today);
        const parts = [
            { label: 'Base fortune', value: 0.4 },
            { label: `Seven-day diligence (${Math.round(h.rate * 100)}%)`, value: 0.35 * h.rate },
            { label: `Streak (${data.streak.current} days)`, value: Math.min(0.15, 0.03 * data.streak.current) },
            { label: `Realm balance (${h.realms}/4)`, value: 0.1 * (h.realms / 4) },
        ];
        if (data.tribulation.attempts > 0) parts.push({ label: `Scars of ${data.tribulation.attempts} failure(s)`, value: 0.1 * data.tribulation.attempts });
        if (deviationActive(data, now)) parts.push({ label: 'Qi Deviation', value: -0.15 });
        const raw = parts.reduce((s, p) => s + p.value, 0);
        const chance = Math.min(0.95, Math.max(0.15, raw));
        const hints = [];
        if (h.rate < 0.8) hints.push('Finish more of what you plan this week');
        if (data.streak.current < 5) hints.push('Clear consecutive days to build your streak');
        if (h.realms < 4) hints.push('Cultivate every realm: Body, Mind, Spirit and Mundane');
        if (deviationActive(data, now)) hints.push(`Qi Deviation lifts after ${data.deviation.until}`);
        return { chance, parts, hints };
    }

    function tribulationState(data, now) {
        const next = nextStage(data);
        if (!next) return { status: 'max' };
        const nowMs = now ? new Date(now).getTime() : Date.now();
        if (data.tribulation.passedStages.includes(next.index)) {
            return { status: 'regained', target: next, needQi: next.minQi - data.qi };
        }
        if (data.qi < next.minQi) return { status: 'locked', target: next, needQi: next.minQi - data.qi };
        if (data.tribulation.cooldownUntil && new Date(data.tribulation.cooldownUntil).getTime() > nowMs) {
            return { status: 'cooldown', target: next, cooldownUntil: data.tribulation.cooldownUntil };
        }
        return { status: 'ready', target: next, ...tribulationChance(data, now) };
    }

    function resolveTribulation(data, now, rng) {
        const state = tribulationState(data, now);
        if (state.status !== 'ready') return { data, events: [], success: false, state };
        const roll = (rng || Math.random)();
        const success = roll < state.chance;
        const events = [];
        const target = state.target;
        const attempts = data.tribulation.attempts;
        if (success) {
            data.tribulation.passedStages.push(target.index);
            data.tribulation.attempts = 0;
            data.tribulation.cooldownUntil = null;
            const bonus = Math.round(target.minQi * 0.1);
            data.qi += bonus;
            events.push(ev(`Heavenly Tribulation conquered. You break through to ${target.name} (+${bonus} Qi).`, 'positive', 'breakthrough'));
            if (!data.titles.includes(target.title)) {
                data.titles.push(target.title);
                events.push(ev(`Title bestowed: "${target.title}"`, 'positive', 'title'));
            }
            events.push(...checkTitles(data, { tribulationPassed: true, chance: state.chance, attempts }));
        } else {
            const current = STAGES[stageIndex(data)];
            data.qi = Math.max(current.minQi, Math.floor(target.minQi * 0.9));
            data.tribulation.attempts += 1;
            const nowMs = now ? new Date(now).getTime() : Date.now();
            data.tribulation.cooldownUntil = new Date(nowMs + 24 * 3600 * 1000).toISOString();
            events.push(ev(`The heavens reject you. Qi burned back to ${data.qi}. Meditate a day before trying again.`, 'negative', 'tribulation-failed'));
        }
        pushLog(data, events);
        return { data, events, success, state, chance: state.chance };
    }

    // ---- difficulty ----
    function tokenize(text) {
        return (String(text || '').toLowerCase().match(/[a-z][a-z0-9']*/g) || []);
    }

    function urgencyFor(date, deadline) {
        if (!deadline || !deadline.date) return { mult: 1, label: 'No deadline', days: null, invalid: false };
        const days = daysBetween(date, deadline.date);
        if (days < 0) return { mult: 1, label: 'Deadline before task date', days, invalid: true };
        let mult, label;
        if (days === 0) { mult = 1.3; label = 'Due the same day'; }
        else if (days <= 2) { mult = 1.2; label = days === 1 ? 'Due tomorrow' : 'Due in 2 days'; }
        else if (days <= 7) { mult = 1.1; label = `Due in ${days} days`; }
        else { mult = 1.05; label = `Due in ${days} days`; }
        if (days === 0 && deadline.time) { mult += 0.05; label += ` at ${deadline.time}`; }
        return { mult, label, days, invalid: false };
    }

    function rateTask(input) {
        const duration = DURATIONS.find((d) => d.minutes === Number(input.duration)) || DURATIONS[1];
        const realm = REALMS[input.realm] || REALMS.mundane;
        const slot = SLOTS[SLOT_INDEX[input.slot]] || SLOTS[1];
        const urgency = urgencyFor(input.date || todayKey(), input.deadline);

        const words = new Set(tokenize(`${input.title} ${input.note}`));
        const keywords = [];
        let hard = 0, easy = 0, aligned = 0;
        for (const w of words) {
            if (LEXICON.hard.includes(w) && hard < 8) { hard += 2; keywords.push({ word: w, kind: 'hard' }); }
            if (LEXICON.easy.includes(w) && easy > -6) { easy -= 2; keywords.push({ word: w, kind: 'easy' }); }
            if (LEXICON[realm.id] && LEXICON[realm.id].includes(w) && aligned < 3) { aligned += 1; keywords.push({ word: w, kind: 'realm' }); }
        }
        const seen = new Map();
        for (const k of keywords) if (!seen.has(k.word) || k.kind !== 'realm') seen.set(k.word, k);
        keywords.length = 0;
        keywords.push(...seen.values());
        const keywordBonus = hard + easy + aligned;
        const core = duration.base * realm.mult * slot.mult * urgency.mult;
        const qi = Math.max(3, Math.min(70, Math.round(core + keywordBonus)));
        const tier = tierFor(qi);

        const breakdown = [
            { label: duration.label, value: `· ${duration.base}` },
            { label: realm.name, value: `x${realm.mult.toFixed(2)}` },
            { label: slot.name, value: `x${slot.mult.toFixed(2)}` },
        ];
        if (urgency.mult !== 1) breakdown.push({ label: urgency.label, value: `x${urgency.mult.toFixed(2)}` });
        if (keywordBonus !== 0) breakdown.push({ label: 'Words', value: `${keywordBonus > 0 ? '+' : ''}${keywordBonus}` });

        return { tier: tier.tier, name: tier.name, qi, urgency: urgency.mult, urgencyLabel: urgency.label, invalidDeadline: urgency.invalid, breakdown, keywords };
    }

    // ---- tasks ----
    const tasksOn = (data, key) =>
        data.tasks
            .filter((t) => t.date === key)
            .sort((a, b) => SLOT_INDEX[a.slot] - SLOT_INDEX[b.slot] || a.id - b.id);

    function normalizeInput(input, now) {
        const title = String(input.title || '').trim();
        const date = input.date || todayKey(now);
        const deadline = input.deadline && input.deadline.date ? { date: input.deadline.date, time: input.deadline.time || null } : null;
        return {
            title,
            note: String(input.note || '').trim(),
            realm: REALMS[input.realm] ? input.realm : 'mundane',
            duration: DURATIONS.some((d) => d.minutes === Number(input.duration)) ? Number(input.duration) : 30,
            date,
            slot: SLOT_INDEX[input.slot] !== undefined ? input.slot : 'morning',
            deadline,
            repeat: ['daily', 'weekly'].includes(input.repeat) ? input.repeat : null,
        };
    }

    function addTask(data, input, now) {
        const fields = normalizeInput(input, now);
        if (!fields.title) return { data, task: null, error: 'A task needs a name.' };
        const rating = rateTask(fields);
        if (rating.invalidDeadline) return { data, task: null, error: 'The deadline cannot be before the task date.' };
        const id = data.nextId++;
        const task = {
            id,
            seriesId: id,
            ...fields,
            difficulty: rating,
            completed: false,
            completedAt: null,
            awarded: 0,
            missed: false,
            createdAt: new Date(now || Date.now()).toISOString(),
        };
        data.tasks.push(task);
        return { data, task, error: null };
    }

    function updateTask(data, id, input, now) {
        const task = data.tasks.find((t) => t.id === id);
        if (!task) return { data, task: null, error: 'Task not found.' };
        const fields = normalizeInput({ ...task, ...input }, now);
        if (!fields.title) return { data, task, error: 'A task needs a name.' };
        const rating = rateTask(fields);
        if (rating.invalidDeadline) return { data, task, error: 'The deadline cannot be before the task date.' };
        Object.assign(task, fields, { difficulty: rating });
        if (task.missed && (!task.deadline || task.deadline.date >= todayKey(now))) task.missed = false;
        return { data, task, error: null };
    }

    function deleteTask(data, id) {
        data.tasks = data.tasks.filter((t) => t.id !== id);
        return { data };
    }

    function completionMultiplier(data, task, now) {
        const parts = [];
        let mult = 1;
        const streakMult = 1 + Math.min(0.2, 0.02 * data.streak.current);
        if (streakMult > 1) { mult *= streakMult; parts.push({ label: `Streak x${streakMult.toFixed(2)}` }); }
        if (deviationActive(data, now)) { mult *= 0.75; parts.push({ label: 'Qi Deviation x0.75' }); }
        if (task.date < todayKey(now)) { mult *= 0.5; parts.push({ label: 'Late Cultivation x0.50' }); }
        return { mult, parts };
    }

    function completeTask(data, id, now) {
        const task = data.tasks.find((t) => t.id === id);
        if (!task || task.completed) return { data, events: [], task, gained: 0 };
        const before = stageIndex(data);
        const { mult, parts } = completionMultiplier(data, task, now);
        const gained = Math.max(1, Math.round(task.difficulty.qi * mult));
        task.completed = true;
        task.completedAt = new Date(now || Date.now()).toISOString();
        task.awarded = gained;
        data.qi += gained;
        data.tasksCompleted += 1;
        if (task.slot === 'dawn') data.counters.dawnDone += 1;
        const suffix = parts.length ? ` (${parts.map((p) => p.label).join(', ')})` : '';
        const events = [ev(`+${gained} Qi from "${task.title}"${suffix}`, 'positive', 'complete')];
        events.push(...stageShiftEvents(data, before));
        events.push(...checkTitles(data, {}));
        pushLog(data, events);
        return { data, events, task, gained };
    }

    // ---- settlement ----
    function settle(data, now) {
        const today = todayKey(now);
        const events = [];
        const reports = [];
        if (!data.lastSettledDate) data.lastSettledDate = addDays(today, -1);
        if (data.lastSettledDate >= addDays(today, -1)) return { data, events, reports };

        let day = addDays(data.lastSettledDate, 1);
        const earliest = addDays(today, -7);
        if (day < earliest) day = earliest;
        const yesterday = addDays(today, -1);
        const before = stageIndex(data);

        while (day <= yesterday) {
            reports.push(settleDay(data, day, events));
            day = addDays(day, 1);
        }
        data.lastSettledDate = yesterday;
        pruneHistory(data, today);
        events.push(...stageShiftEvents(data, before));
        events.push(...checkTitles(data, {}));
        data.lastSettlementReport = reports.length ? { settledOn: today, reports } : null;
        pushLog(data, events);
        return { data, events, reports };
    }

    function settleDay(data, day, events) {
        const tasks = tasksOn(data, day);
        const planned = tasks.length;
        const doneTasks = tasks.filter((t) => t.completed);
        const done = doneTasks.length;
        const earned = doneTasks.reduce((s, t) => s + (t.awarded || 0), 0);
        const realms = { body: 0, mind: 0, spirit: 0, mundane: 0 };
        for (const t of doneTasks) realms[t.realm] = (realms[t.realm] || 0) + 1;
        const lines = [];
        let loss = 0;
        let bonus = 0;
        let verdict = 'quiet';
        let missedDeadlines = 0;

        if (planned > 0) {
            if (done === planned) verdict = 'cleared';
            else if (done / planned >= 0.5) verdict = 'partial';
            else verdict = 'poor';
        }

        for (const t of tasks) {
            if (!t.completed && t.deadline && t.deadline.date <= day && !t.missed) {
                t.missed = true;
                missedDeadlines += 1;
                const penalty = 3 + Math.round(0.25 * t.difficulty.qi);
                loss += penalty;
                lines.push({ kind: 'negative', text: `Deadline missed: "${t.title}" (-${penalty} Qi)` });
            }
        }

        if (verdict === 'cleared') {
            bonus = Math.max(5, Math.round(0.15 * earned));
            data.streak.current += 1;
            data.streak.best = Math.max(data.streak.best, data.streak.current);
            data.streak.lastClearedDate = day;
            lines.push({ kind: 'positive', text: `Day cleared: ${done}/${planned} tasks (+${bonus} Qi)` });
            const milestone = STREAK_MILESTONES[data.streak.current];
            if (milestone) {
                bonus += milestone;
                lines.push({ kind: 'positive', text: `${data.streak.current}-day streak (+${milestone} Qi)` });
            }
        } else if (verdict === 'partial') {
            lines.push({ kind: 'neutral', text: `Half-measures: ${done}/${planned} tasks. Streak holds.` });
        } else if (verdict === 'poor') {
            const unfinished = planned - done;
            loss += 3 * unfinished;
            lines.push({ kind: 'negative', text: `Neglect: ${done}/${planned} tasks (-${3 * unfinished} Qi). Streak broken.` });
            data.streak.current = 0;
            if (data.lastPoorDate === addDays(day, -1)) {
                data.deviation.until = addDays(day, 2);
                lines.push({ kind: 'negative', text: `Qi Deviation sets in until ${data.deviation.until}` });
            }
            data.lastPoorDate = day;
        } else {
            lines.push({ kind: 'neutral', text: 'A quiet day. Nothing planned, nothing lost.' });
        }

        const cap = Math.floor(data.qi * 0.1);
        const appliedLoss = Math.min(loss, cap);
        if (loss > appliedLoss) lines.push({ kind: 'neutral', text: `Mercy of the heavens: loss capped at ${appliedLoss} Qi` });
        data.qi = Math.max(0, data.qi - appliedLoss + bonus);

        const fourfold = verdict === 'cleared' && Object.values(realms).every((n) => n > 0);
        if (fourfold) events.push(...checkTitles(data, { fourfoldDay: true }));

        for (const t of tasks) {
            if (!t.repeat) continue;
            const nextDate = addDays(day, t.repeat === 'daily' ? 1 : 7);
            const exists = data.tasks.some((o) => o.seriesId === t.seriesId && o.date === nextDate);
            if (exists) continue;
            const id = data.nextId++;
            const copy = { ...t, id, date: nextDate, completed: false, completedAt: null, awarded: 0, missed: false };
            if (t.deadline) {
                const gap = daysBetween(t.date, t.deadline.date);
                copy.deadline = { date: addDays(nextDate, Math.max(0, gap)), time: t.deadline.time };
            }
            copy.difficulty = rateTask(copy);
            data.tasks.push(copy);
        }

        data.history[day] = { planned, done, missedDeadlines, cleared: verdict === 'cleared', verdict, qiEarned: earned + bonus, qiLost: appliedLoss, realms };
        const delta = bonus - appliedLoss;
        events.push(ev(`${day} settled: ${verdict}${delta ? ` (${delta > 0 ? '+' : ''}${delta} Qi)` : ''}`, delta < 0 ? 'negative' : delta > 0 ? 'positive' : 'neutral', 'settlement'));
        return { date: day, verdict, planned, done, qiDelta: delta, lines };
    }

    function pruneHistory(data, today) {
        const cutoff = addDays(today, -60);
        for (const key of Object.keys(data.history)) if (key < cutoff) delete data.history[key];
        data.tasks = data.tasks.filter((t) => t.date >= cutoff);
    }

    // ---- titles, events ----
    function checkTitles(data, ctx) {
        const events = [];
        for (const rule of TITLE_RULES) {
            if (data.titles.includes(rule.title)) continue;
            if (rule.test(data, ctx || {})) {
                data.titles.push(rule.title);
                events.push(ev(`Title bestowed: "${rule.title}"`, 'positive', 'title'));
            }
        }
        return events;
    }

    function stageShiftEvents(data, beforeIndex) {
        const after = stageIndex(data);
        if (after === beforeIndex) return [];
        if (after < beforeIndex) return [ev(`Your foundation trembles. You fall back to ${STAGES[after].name}.`, 'negative', 'stage-down')];
        return [ev(`Your Qi steadies. ${STAGES[after].name} is restored.`, 'positive', 'stage-up')];
    }

    function ev(message, type, kind) {
        return { message, type: type || 'neutral', kind: kind || 'info', at: Date.now() };
    }

    function pushLog(data, events) {
        if (!events.length) return;
        data.log = events.concat(data.log || []).slice(0, 60);
    }

    CS.Game = {
        STAGES, SLOTS, REALMS, DURATIONS, TIERS, LEXICON, TITLE_RULES, STREAK_MILESTONES,
        todayKey, dateKey, parseKey, addDays, daysBetween, slotFor, currentSlot,
        defaultData, migrate, tierFor,
        stageIndex, stageFor, nextStage, tribulationState, tribulationChance, resolveTribulation,
        rateTask, urgencyFor, tasksOn, addTask, updateTask, deleteTask, completeTask, completionMultiplier,
        settle, checkTitles, deviationActive, history7,
    };
})(typeof window !== 'undefined' ? window : globalThis);
