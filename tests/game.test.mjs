import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

vm.runInThisContext(fs.readFileSync(new URL('../www/js/game.js', import.meta.url), 'utf8'));
const G = globalThis.CS.Game;
const NOW = new Date(2026, 8, 26, 10, 0, 0); // Sat 2026-09-26 10:00 local
const today = G.todayKey(NOW);
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('ok -', name); };

test('dates', () => {
  assert.equal(today, '2026-09-26');
  assert.equal(G.addDays(today, -1), '2026-09-25');
  assert.equal(G.daysBetween('2026-09-26', '2026-10-03'), 7);
  assert.equal(G.slotFor(3).id, 'night');
  assert.equal(G.slotFor(6).id, 'dawn');
  assert.equal(G.slotFor(23).id, 'night');
});

test('migration keeps stage and moves weekday tasks to dates', () => {
  const v1 = { qi: 40, exp: 160, tasksCompleted: 12, titles: ['Task Conqueror'],
    schedule: { Monday: [{ id: 1, title: 'Gym', note: '', qi: 20, completed: false }], Saturday: [{ id: 2, title: 'Read', note: '', qi: 10, completed: true }] } };
  const d = G.migrate(JSON.parse(JSON.stringify(v1)), NOW);
  assert.equal(d.version, 2);
  assert.equal(d.qi, 500); // exp 160 -> v1 stage 2 (Core Formation) -> new stage 2 min 500
  assert.deepEqual(d.tribulation.passedStages, [0, 1, 2]);
  assert.equal(G.stageFor(d).name, 'Foundation Establishment');
  const sat = d.tasks.find((t) => t.title === 'Read');
  assert.equal(sat.date, '2026-09-26');
  const mon = d.tasks.find((t) => t.title === 'Gym');
  assert.equal(mon.date, '2026-09-28');
  assert.equal(mon.repeat, 'weekly');
});

test('rateTask is monotonic in duration and urgency, keywords bite', () => {
  const base = { title: 'Tidy desk', note: '', realm: 'mundane', slot: 'morning', date: today, deadline: null };
  const r15 = G.rateTask({ ...base, duration: 15 });
  const r60 = G.rateTask({ ...base, duration: 60 });
  const r240 = G.rateTask({ ...base, duration: 240 });
  assert.ok(r15.qi < r60.qi && r60.qi < r240.qi);
  const due = G.rateTask({ ...base, duration: 60, deadline: { date: today, time: '18:00' } });
  assert.ok(due.qi > r60.qi);
  assert.equal(due.urgency, 1.35);
  const hard = G.rateTask({ title: 'Study for exam and write essay', note: '', realm: 'mind', duration: 60, slot: 'dawn', date: today, deadline: null });
  assert.ok(hard.qi >= 25, `hard qi ${hard.qi}`);
  assert.equal(hard.tier, 4);
  const invalid = G.rateTask({ ...base, duration: 30, deadline: { date: G.addDays(today, -1), time: null } });
  assert.equal(invalid.invalidDeadline, true);
  assert.ok(r15.qi >= 3);
});

test('add/complete pays Qi, late pays half, titles unlock', () => {
  const d = G.defaultData(NOW);
  const { task } = G.addTask(d, { title: 'Morning run', realm: 'body', duration: 30, slot: 'dawn', date: today }, NOW);
  assert.ok(task.difficulty.qi > 0);
  const res = G.completeTask(d, task.id, NOW);
  assert.equal(res.gained, task.difficulty.qi);
  assert.equal(d.qi, task.difficulty.qi);
  assert.equal(d.counters.dawnDone, 1);
  const late = G.addTask(d, { title: 'Dishes', realm: 'mundane', duration: 15, slot: 'dusk', date: G.addDays(today, -2) }, NOW).task;
  const lateRes = G.completeTask(d, late.id, NOW);
  assert.equal(lateRes.gained, Math.max(1, Math.round(late.difficulty.qi * 0.5)));
  for (let i = 0; i < 10; i++) {
    const t = G.addTask(d, { title: `t${i}`, realm: 'mind', duration: 15, slot: 'noon', date: today }, NOW).task;
    G.completeTask(d, t.id, NOW);
  }
  assert.ok(d.titles.includes('Task Conqueror'));
});

test('settlement: cleared day bonus + streak, poor day loss capped, weekly spawn once', () => {
  const d = G.defaultData(NOW);
  d.qi = 200; d.tribulation.passedStages = [0, 1];
  d.lastSettledDate = G.addDays(today, -3);
  const d2 = G.addDays(today, -2), d1 = G.addDays(today, -1);
  const a = G.addTask(d, { title: 'Meditate', realm: 'spirit', duration: 30, slot: 'dawn', date: d2, repeat: 'weekly' }, NOW).task;
  G.completeTask(d, a.id, new Date(2026, 8, 24, 7));
  const qiAfterA = d.qi;
  for (let i = 0; i < 5; i++) G.addTask(d, { title: `Big ${i}`, realm: 'body', duration: 240, slot: 'morning', date: d1, deadline: { date: d1, time: null } }, NOW);
  const { reports } = G.settle(d, NOW);
  assert.equal(reports.length, 2);
  assert.equal(reports[0].verdict, 'cleared');
  assert.equal(d.streak.current, 0); // broken by the poor day after
  assert.equal(d.streak.best, 1);
  assert.equal(reports[1].verdict, 'poor');
  const cap = Math.floor((qiAfterA + reports[0].qiDelta) * 0.1);
  assert.equal(-reports[1].qiDelta, cap, 'loss capped at 10%');
  assert.ok(d.tasks.filter((t) => t.date === d1).every((t) => t.missed));
  const spawned = d.tasks.filter((t) => t.seriesId === a.seriesId && t.date === G.addDays(d2, 7));
  assert.equal(spawned.length, 1);
  assert.equal(spawned[0].completed, false);
  assert.equal(d.lastSettledDate, d1);
  // settling again is a no-op
  const again = G.settle(d, NOW);
  assert.equal(again.reports.length, 0);
  assert.equal(d.tasks.filter((t) => t.seriesId === a.seriesId).length, 2);
});

test('tribulation gate, pass and fail', () => {
  const d = G.defaultData(NOW);
  d.qi = 160;
  let st = G.tribulationState(d, NOW);
  assert.equal(st.status, 'ready');
  assert.ok(st.chance >= 0.15 && st.chance <= 0.95);
  assert.equal(G.stageFor(d).name, 'Mortal');
  const fail = G.resolveTribulation(d, NOW, () => 0.99);
  assert.equal(fail.success, false);
  assert.equal(d.qi, 135);
  assert.equal(d.tribulation.attempts, 1);
  assert.equal(G.tribulationState(d, NOW).status, 'locked');
  d.qi = 170;
  assert.equal(G.tribulationState(d, NOW).status, 'cooldown');
  const later = new Date(NOW.getTime() + 25 * 3600 * 1000);
  st = G.tribulationState(d, later);
  assert.equal(st.status, 'ready');
  const pass = G.resolveTribulation(d, later, () => 0.0);
  assert.equal(pass.success, true);
  assert.equal(d.qi, 185);
  assert.equal(G.stageFor(d).name, 'Qi Condensation');
  assert.ok(d.titles.includes('Student of the Way'));
  d.qi = 100;
  assert.equal(G.stageFor(d).name, 'Mortal');
  assert.equal(G.tribulationState(d, later).status, 'regained');
});

console.log(`\n${passed} test groups passed`);
