import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SchedulerApi } from '../src/api.ts';
import { newDraft, toDraft } from '../src/model.ts';
import { backend, fixture, clone } from './fixtures.mjs';
test('creates and confirms a normalized schedule without a browser timer', async () => {
  const b = backend();
  const api = new SchedulerApi(() => b.hass);
  const result = await api.save(newDraft('climate.test', b.hass));
  assert.equal(result.length, 1);
  assert.equal(b.writes.length, 1);
  assert.equal(b.writes[0].path, 'scheduler/add');
  assert.equal(b.writes[0].payload.timeslots.at(-1).stop, '00:00:00');
});
test('edits preserve tags and never force enabled state', async () => {
  const { schedule } = fixture();
  schedule.enabled = false;
  const b = backend([schedule]);
  b.hass.states['switch.plan'].state = 'off';
  const d = toDraft(schedule);
  d.periods[0].temperature = 18;
  const result = await new SchedulerApi(() => b.hass).save(d, schedule);
  assert.equal(result[0].enabled, false);
  assert.deepEqual(result[0].tags, ['private-tag']);
  assert.ok(!('enabled' in b.writes[0].payload));
});
test('refuses stale edits before any write', async () => {
  const { schedule } = fixture();
  const b = backend([{ ...schedule, name: 'Changed elsewhere' }]);
  await assert.rejects(() => new SchedulerApi(() => b.hass).save(toDraft(schedule), schedule), /inzwischen/);
  assert.equal(b.writes.length, 0);
});
test('refuses overlapping active plans before any write', async () => {
  const { schedule } = fixture();
  const b = backend([schedule]);
  await assert.rejects(
    () => new SchedulerApi(() => b.hass).save(newDraft('climate.test', b.hass)),
    /bereits/,
  );
  assert.equal(b.writes.length, 0);
});
test('uncertain network writes are not retried', async () => {
  const b = backend();
  let count = 0;
  b.hass.callApi = async () => {
    count++;
    throw new Error('connection lost');
  };
  await assert.rejects(
    () => new SchedulerApi(() => b.hass).save(newDraft('climate.test', b.hass)),
    /connection lost/,
  );
  assert.equal(count, 1);
});
test('negative backend response is not reported as success', async () => {
  const b = backend();
  b.hass.callApi = async () => ({ success: false });
  await assert.rejects(
    () => new SchedulerApi(() => b.hass).save(newDraft('climate.test', b.hass)),
    /nicht gespeichert/,
  );
});
test('malformed list replies are rejected', async () => {
  const b = backend();
  b.hass.callWS = async () => ({ schedules: [] });
  await assert.rejects(() => new SchedulerApi(() => b.hass).list(), /Antwortformat/);
});
test('toggle checks that the schedule still has the same entity', async () => {
  const { schedule } = fixture();
  const b = backend([{ ...schedule, entity_id: 'switch.renamed' }]);
  await assert.rejects(() => new SchedulerApi(() => b.hass).toggle(schedule, false), /verändert/);
  assert.equal(b.writes.length, 0);
});
test('activation refuses a conflicting plan', async () => {
  const { schedule } = fixture();
  const other = { ...clone(schedule), schedule_id: 'other', entity_id: 'switch.other' };
  const b = backend([schedule, other]);
  b.hass.states['switch.plan'].state = 'off';
  await assert.rejects(() => new SchedulerApi(() => b.hass).toggle(schedule, true), /bereits aktiv/);
  assert.equal(b.writes.length, 0);
});

test('deletion refuses changed configuration', async () => {
  const { schedule } = fixture();
  const b = backend([{ ...schedule, name: 'Changed' }]);
  await assert.rejects(() => new SchedulerApi(() => b.hass).remove(schedule), /inzwischen/);
  assert.equal(b.writes.length, 0);
});
test('enabling an advanced plan still checks conflicts', async () => {
  const { schedule } = fixture();
  const complex = clone(schedule);
  complex.schedule_id = 'complex';
  complex.entity_id = 'switch.complex';
  complex.timeslots[0].conditions = [{ entity_id: 'binary_sensor.window', value: 'off' }];
  const b = backend([schedule, complex]);
  await assert.rejects(() => new SchedulerApi(() => b.hass).toggle(complex, true), /bereits aktiv/);
  assert.equal(b.writes.length, 0);
});
