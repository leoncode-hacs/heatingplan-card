import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture, clone } from './fixtures.mjs';
import {
  DAYS,
  minutes,
  endMinutes,
  roomList,
  newDraft,
  validateDraft,
  toDraft,
  editProblem,
  payload,
  conflicts,
  currentClock,
  insertPeriod,
  fingerprint,
} from '../src/model.ts';

test('independent room discovery uses entity override before device area', () => {
  const { hass, entity } = fixture();
  assert.equal(roomList(hass)[0].name, 'Bad');
  hass.entities[entity].area_id = 'office';
  hass.areas.office = { name: 'Büro' };
  assert.equal(roomList(hass)[0].name, 'Büro');
  delete hass.areas;
  assert.equal(roomList(hass)[0].name, 'Thermostat');
  assert.deepEqual(roomList(hass, []), []);
});
test('midnight serialization follows Scheduler API and round trips normalized defaults', () => {
  const { schedule } = fixture();
  assert.equal(editProblem(schedule), null);
  const draft = toDraft(schedule);
  const out = payload(draft, schedule);
  assert.equal(out.timeslots.at(-1).stop, '00:00:00');
  assert.deepEqual(out.tags, ['private-tag']);
  assert.ok(!('enabled' in out));
  assert.ok(!('conditions' in out.timeslots[0]));
  assert.deepEqual(toDraft({ ...schedule, ...out }), draft);
  assert.equal(endMinutes('00:00:00'), 1440);
});
test('invalid time values and second precision are rejected', () => {
  assert.ok(Number.isNaN(minutes('25:00')));
  assert.ok(Number.isNaN(minutes('07:60')));
  assert.ok(Number.isNaN(minutes('07:00:30')));
  const { schedule } = fixture();
  schedule.timeslots[1].start = '07:00:30';
  assert.ok(editProblem(schedule));
});
for (const [label, mutate] of [
  ['conditions', (s) => (s.timeslots[0].conditions = [{ entity_id: 'binary_sensor.window', value: 'off' }])],
  ['tracking', (s) => (s.timeslots[0].track_conditions = true)],
  ['different services', (s) => (s.timeslots[0].actions[0].service = 'climate.set_fan_mode')],
  ['extra hvac mode', (s) => (s.timeslots[0].actions[0].service_data.hvac_mode = 'cool')],
  ['multiple actions', (s) => s.timeslots[0].actions.push(clone(s.timeslots[0].actions[0]))],
  ['multiple entities', (s) => (s.timeslots[1].actions[0].entity_id = 'climate.other')],
  ['date period', (s) => (s.end_date = '2027-01-01')],
  ['single execution', (s) => (s.repeat_type = 'single')],
  ['missing stop', (s) => delete s.timeslots[0].stop],
  ['gaps', (s) => (s.timeslots[1].start = '08:00:00')],
  ['overlap', (s) => (s.timeslots[1].start = '06:00:00')],
  ['unknown calendar', (s) => (s.weekdays = ['mystery'])],
])
  test(`protects existing ${label} from lossy editing`, () => {
    const { schedule } = fixture();
    mutate(schedule);
    const before = JSON.stringify(schedule);
    assert.ok(editProblem(schedule));
    assert.throws(() => toDraft(schedule));
    assert.equal(JSON.stringify(schedule), before);
  });
test('working-day plans remain editable without flattening the holiday calendar', () => {
  const { schedule, hass } = fixture();
  schedule.weekdays = ['workday'];
  assert.equal(editProblem(schedule), null);
  const d = toDraft(schedule);
  assert.deepEqual(d.weekdays, ['workday']);
  assert.equal(validateDraft(d, hass), null);
  assert.deepEqual(payload(d, schedule).weekdays, ['workday']);
});
test('validates sorted times, duplicates, range, supported temperature step and weekdays', () => {
  const { hass, entity } = fixture();
  const draft = newDraft(entity, hass);
  assert.equal(validateDraft(draft, hass), null);
  for (const change of [
    (d) => (d.periods[0].start = 30),
    (d) => (d.periods[1].start = 0),
    (d) => (d.periods[1].temperature = 40),
    (d) => (d.periods[1].temperature = 19.3),
    (d) => (d.weekdays = []),
    (d) => (d.name = ''),
    (d) => (d.weekdays = ['workday', 'mon']),
  ]) {
    const d = clone(draft);
    change(d);
    assert.ok(validateDraft(d, hass));
  }
});
test('conflicts protect room/day scope and include other action formats', () => {
  const { hass, schedule } = fixture();
  const d = toDraft(schedule);
  assert.equal(conflicts(d, [schedule], hass).length, 1);
  assert.equal(conflicts(d, [schedule], hass, 'plan').length, 0);
  d.weekdays = ['sun'];
  assert.equal(conflicts(d, [schedule], hass).length, 0);
  schedule.weekdays = ['workday'];
  assert.equal(conflicts(d, [schedule], hass).length, 1);
  d.weekdays = ['weekend'];
  assert.equal(conflicts(d, [schedule], hass).length, 0);
});
test('date display follows Home Assistant timezone including DST', () => {
  const { hass } = fixture();
  assert.deepEqual(currentClock(hass, new Date('2026-03-29T01:30:00Z')), { day: 6, minute: 210 });
  assert.deepEqual(currentClock(hass, new Date('2026-09-13T23:15:00Z')), { day: 0, minute: 75 });
});
test('period insertion preserves order and temperatures', () => {
  const p = [
    { start: 0, temperature: 17 },
    { start: 600, temperature: 21 },
  ];
  const out = insertPeriod(p);
  assert.equal(out.length, 3);
  assert.equal(out[2].start, 1020);
  assert.equal(p.length, 2);
});
test('fingerprint excludes transient runtime countdowns but detects config changes', () => {
  const { schedule } = fixture();
  assert.equal(fingerprint(schedule), fingerprint({ ...schedule, timestamps: ['later'] }));
  assert.notEqual(fingerprint(schedule), fingerprint({ ...schedule, name: 'Anders' }));
});
test('Fahrenheit defaults are converted and respect device bounds', () => {
  const { hass, entity } = fixture();
  hass.config.unit_system.temperature = '°F';
  Object.assign(hass.states[entity].attributes, { min_temp: 45, max_temp: 85, target_temp_step: 1 });
  const draft = newDraft(entity, hass);
  assert.equal(draft.periods[1].temperature, 70);
  assert.equal(validateDraft(draft, hass), null);
});

test('off periods round trip without a temperature and resume heating explicitly', () => {
  const { hass, entity } = fixture();
  const draft = newDraft(entity, hass);
  draft.periods[0].mode = 'off';
  assert.equal(validateDraft(draft, hass), null);
  const data = payload(draft);
  assert.deepEqual(data.timeslots[0].actions[0], {
    entity_id: entity,
    service: 'climate.set_hvac_mode',
    service_data: { hvac_mode: 'off' },
  });
  assert.equal(data.timeslots[1].actions[0].service_data.hvac_mode, 'heat');
  const schedule = { ...data, schedule_id: 'offplan', entity_id: 'switch.offplan' };
  assert.equal(editProblem(schedule), null);
  const restored = toDraft(schedule);
  assert.equal(restored.periods[0].mode, 'off');
  assert.equal(restored.periods[1].mode, 'heat');
  assert.deepEqual(payload(restored).timeslots, data.timeslots);
});

test('off plans validate device capabilities and do not require temperatures for off slots', () => {
  const { hass, entity } = fixture();
  const draft = newDraft(entity, hass);
  draft.periods = [{ start: 0, mode: 'off', temperature: NaN }];
  assert.equal(validateDraft(draft, hass), null);
  hass.states[entity].attributes.hvac_modes = ['heat'];
  assert.match(validateDraft(draft, hass), /Aus-Modus/);
  hass.states[entity].attributes.hvac_modes = ['off'];
  draft.periods.push({ start: 600, temperature: 21 });
  assert.match(validateDraft(draft, hass), /zurückkehren/);
});

test('plain existing turn_off is editable but additional off service data is protected', () => {
  const { schedule } = fixture();
  schedule.timeslots[0].actions = [{ service: 'climate.turn_off', entity_id: 'climate.test' }];
  assert.equal(editProblem(schedule), null);
  assert.equal(toDraft(schedule).periods[0].mode, 'off');
  schedule.timeslots[0].actions[0].service_data = { unknown_option: true };
  assert.ok(editProblem(schedule));
});
