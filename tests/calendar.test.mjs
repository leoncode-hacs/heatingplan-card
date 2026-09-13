import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './fixtures.mjs';
import {
  localDate,
  weekDates,
  addDays,
  loadCalendarWeek,
  scheduleDay,
  WORKDAY_ENTITY,
} from '../src/calendar.ts';

test('concrete weeks follow HA timezone across DST and year boundaries', () => {
  const { hass } = fixture();
  assert.equal(localDate(hass, new Date('2026-03-29T23:30:00Z')), '2026-03-30');
  assert.deepEqual(weekDates(hass, 0, new Date('2027-01-01T12:00Z')), [
    '2026-12-28',
    '2026-12-29',
    '2026-12-30',
    '2026-12-31',
    '2027-01-01',
    '2027-01-02',
    '2027-01-03',
  ]);
  assert.equal(weekDates(hass, 1, new Date('2026-03-29T12:00Z'))[0], '2026-03-30');
});

test('missing canonical sensor uses Scheduler standard week without guessing another sensor', async () => {
  const { hass } = fixture();
  hass.states['binary_sensor.other_workday'] = { state: 'off', attributes: {} };
  hass.callWS = () => {
    throw new Error('must not query');
  };
  const week = await loadCalendarWeek(hass, ['2026-09-14', '2026-09-19']);
  assert.deepEqual(week['2026-09-14'], { workday: true, source: 'standard' });
  assert.deepEqual(week['2026-09-19'], { workday: false, source: 'standard' });
});

test('today uses live sensor, other dates use holiday-aware canonical response', async () => {
  const { hass } = fixture();
  const today = localDate(hass),
    tomorrow = addDays(today, 1),
    calls = [];
  hass.states[WORKDAY_ENTITY] = { state: 'off', attributes: {} };
  hass.callWS = async (message) => {
    calls.push(message);
    return { response: { [WORKDAY_ENTITY]: { workday: true } } };
  };
  const week = await loadCalendarWeek(hass, [today, tomorrow]);
  assert.deepEqual(week[today], { workday: false, source: 'sensor' });
  assert.deepEqual(week[tomorrow], { workday: true, source: 'calendar' });
  assert.deepEqual(calls, [
    {
      type: 'call_service',
      domain: 'workday',
      service: 'check_date',
      service_data: { check_date: tomorrow },
      target: { entity_id: WORKDAY_ENTITY },
      return_response: true,
    },
  ]);
});

test('rejected, malformed, wrong-entity and timed-out calendar replies stay unknown', async () => {
  const { hass } = fixture();
  hass.states[WORKDAY_ENTITY] = { state: 'unavailable', attributes: {} };
  for (const query of [
    async () => {
      throw new Error('denied');
    },
    async () => ({}),
    async () => ({ response: { other: { workday: true } } }),
    () => new Promise(() => {}),
  ]) {
    hass.callWS = query;
    assert.deepEqual((await loadCalendarWeek(hass, ['2026-09-14'], 5))['2026-09-14'], {
      workday: null,
      source: 'unknown',
    });
  }
});

test('holiday assignment distinguishes fixed weekdays, workdays, free days and unknown rules', () => {
  const { schedule } = fixture(),
    date = '2026-09-14';
  const free = { [date]: { workday: false, source: 'calendar' } };
  assert.equal(scheduleDay({ ...schedule, weekdays: ['mon'] }, date, free), 'yes');
  assert.equal(scheduleDay({ ...schedule, weekdays: ['workday'] }, date, free), 'no');
  assert.equal(scheduleDay({ ...schedule, weekdays: ['weekend'] }, date, free), 'yes');
  assert.equal(scheduleDay({ ...schedule, weekdays: ['workday'] }, date, {}), 'unknown');
  assert.equal(scheduleDay({ ...schedule, weekdays: ['workday', 'mon'] }, date, free), 'unknown');
  assert.equal(scheduleDay({ ...schedule, weekdays: ['daily'], start_date: '2026-09-15' }, date, free), 'no');
  assert.equal(scheduleDay({ ...schedule, weekdays: ['daily'], end_date: date }, date, free), 'yes');
  assert.equal(scheduleDay({ ...schedule, weekdays: ['daily'], end_date: '2026-09-13' }, date, free), 'no');
});

test('ISO calendar week uses its week-year at both year boundaries', async () => {
  const { calendarWeek } = await import('../src/calendar.ts');
  assert.deepEqual(calendarWeek('2027-01-01'), { week: 53, year: 2026 });
  assert.deepEqual(calendarWeek('2024-12-30'), { week: 1, year: 2025 });
  assert.deepEqual(calendarWeek('2026-09-13'), { week: 37, year: 2026 });
});
