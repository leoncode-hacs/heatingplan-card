import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture, clone } from './fixtures.mjs';
import { roomList } from '../src/model.ts';
import { roomOverview, upcomingDates } from '../src/overview.ts';
const now = new Date('2026-09-14T04:30:00Z'); // Monday 06:30 in HA timezone
const summary = (hass, plans, calendar = {}, date = now) =>
  roomOverview(roomList(hass), plans, hass, calendar, date);

test('next actions are sorted across rooms and include heating off', () => {
  const { hass, schedule } = fixture();
  hass.states['climate.second'] = {
    ...clone(hass.states['climate.test']),
    entity_id: 'climate.second',
    attributes: { ...hass.states['climate.test'].attributes, friendly_name: 'Zweiter Raum' },
  };
  const second = { ...clone(schedule), schedule_id: 'second', entity_id: 'switch.second' };
  for (const slot of second.timeslots) slot.actions[0].entity_id = 'climate.second';
  second.timeslots[0].stop = '08:00:00';
  second.timeslots[1].start = '08:00:00';
  schedule.timeslots[1].actions = [
    { service: 'climate.set_hvac_mode', entity_id: 'climate.test', service_data: { hvac_mode: 'off' } },
  ];
  const result = summary(hass, [second, schedule]);
  assert.deepEqual(
    result.map((r) => [r.room.id, r.next.minute, r.status]),
    [
      ['climate.test', 420, 'next'],
      ['climate.second', 480, 'next'],
    ],
  );
  assert.equal(result[0].next.slot.actions[0].service_data.hvac_mode, 'off');
});

test('past actions are skipped and the lookahead reaches the same weekday next week', () => {
  const { hass, schedule } = fixture();
  schedule.weekdays = ['mon'];
  const result = summary(hass, [schedule], {}, new Date('2026-09-14T21:30:00Z'))[0];
  assert.equal(result.next.date, '2026-09-21');
  assert.equal(result.next.minute, 0);
  assert.equal(upcomingDates(hass, new Date('2026-03-29T23:30:00Z'))[0], '2026-03-30');
});

test('paused and missing plans have distinct states; unavailable schedules are not called paused', () => {
  const { hass, schedule } = fixture();
  assert.equal(summary(hass, [])[0].status, 'none');
  hass.states['switch.plan'].state = 'off';
  assert.equal(summary(hass, [schedule])[0].status, 'paused');
  hass.states['switch.plan'].state = 'unavailable';
  assert.equal(summary(hass, [schedule])[0].status, 'unknown');
});

test('holiday-aware calendar finds free-day action and does not guess when an earlier action is unknown', () => {
  const { hass, schedule } = fixture();
  schedule.weekdays = ['weekend'];
  const calendar = Object.fromEntries(
    upcomingDates(hass, now).map((d) => [d, { workday: false, source: 'calendar' }]),
  );
  assert.equal(summary(hass, [schedule], calendar)[0].next.minute, 420);
  assert.equal(summary(hass, [schedule])[0].status, 'unknown');
  const fixed = { ...clone(schedule), schedule_id: 'fixed', entity_id: 'switch.fixed', weekdays: ['mon'] };
  fixed.timeslots[0].stop = '10:00:00';
  fixed.timeslots[1].start = '10:00:00';
  assert.equal(summary(hass, [fixed, schedule])[0].status, 'unknown');
});

test('unsupported conditions and overlapping plans never advertise a definite target', () => {
  const { hass, schedule } = fixture();
  const conditional = clone(schedule);
  conditional.timeslots[0].conditions = [{ entity_id: 'binary_sensor.window' }];
  assert.equal(summary(hass, [conditional])[0].status, 'unknown');
  const other = { ...clone(schedule), schedule_id: 'other', entity_id: 'switch.other' };
  assert.equal(summary(hass, [schedule, other])[0].status, 'conflict');
});

test('room filtering and unreachable thermostat status are preserved', () => {
  const { hass, schedule } = fixture();
  hass.states['climate.test'].state = 'unavailable';
  assert.equal(summary(hass, [schedule])[0].unavailable, true);
  assert.deepEqual(roomOverview(roomList(hass, []), [schedule], hass, {}, now), []);
});
