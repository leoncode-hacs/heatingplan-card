import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';
import { backend, fixture, clone } from './fixtures.mjs';
const source = await readFile(new URL('../dist/heatingplan-card.js', import.meta.url), 'utf8');
async function mount(b, config = { type: 'custom:heatingplan-card' }) {
  const w = new Window({ url: 'http://test.local' });
  w.structuredClone = structuredClone;
  w.eval(source);
  const card = w.document.createElement('heatingplan-card');
  card.setConfig(config);
  card.hass = b.hass;
  w.document.body.append(card);
  await settle();
  return {
    w,
    card,
    root: card.shadowRoot,
    close: async () => {
      card.remove();
      await w.happyDOM.abort();
    },
  };
}
const settle = () => new Promise((r) => setTimeout(r, 15));
const button = (root, action) => root.querySelector(`[data-action="${action}"]`);
function fill(w, el, value) {
  el.value = value;
  el.dispatchEvent(new w.Event('input', { bubbles: true, composed: true }));
  el.dispatchEvent(new w.Event('change', { bubbles: true, composed: true }));
}
test('registers only independently named elements and shows Heating Plan Card', async () => {
  const m = await mount(backend());
  try {
    assert.ok(m.w.customElements.get('heatingplan-card'));
    assert.equal(m.w.customElements.get('scheduler-card'), undefined);
    assert.equal(m.w.customCards[0].name, 'Heating Plan Card');
    assert.ok(m.root.textContent.includes('Heizplan'));
  } finally {
    await m.close();
  }
});
test('create from empty state, confirmed save and reopen edit', async () => {
  const b = backend();
  const m = await mount(b);
  try {
    button(m.root, 'new-day').click();
    assert.ok(m.root.querySelector('[role="dialog"]'));
    fill(m.w, m.root.querySelector('[data-field="name"]'), 'Mein Sonntag');
    button(m.root, 'save').click();
    await settle();
    assert.equal(b.writes.length, 1);
    assert.equal(m.root.querySelector('[role="dialog"]'), null);
    assert.match(m.root.querySelector('[role="status"]').textContent, /gespeichert/);
    button(m.root, 'edit').click();
    await settle();
    assert.equal(m.root.querySelector('[data-field="name"]').value, 'Mein Sonntag');
  } finally {
    await m.close();
  }
});
test('edit and undo restore temperatures and retain tags', async () => {
  const { schedule } = fixture();
  schedule.weekdays = ['daily'];
  const b = backend([schedule]);
  const m = await mount(b);
  try {
    button(m.root, 'edit').click();
    await settle();
    fill(m.w, m.root.querySelector('[data-temperature="1"]'), '22');
    button(m.root, 'save').click();
    await settle();
    assert.equal(b.schedules[0].timeslots[1].actions[0].service_data.temperature, 22);
    button(m.root, 'undo').click();
    await settle();
    assert.equal(b.schedules[0].timeslots[1].actions[0].service_data.temperature, 21);
    assert.deepEqual(b.schedules[0].tags, ['private-tag']);
  } finally {
    await m.close();
  }
});
test('unsaved changes require explicit discard and issue no write', async () => {
  const b = backend();
  const m = await mount(b);
  try {
    button(m.root, 'new').click();
    fill(m.w, m.root.querySelector('[data-field="name"]'), 'Changed');
    button(m.root, 'close').click();
    assert.ok(button(m.root, 'discard'));
    button(m.root, 'keep').click();
    assert.equal(m.root.querySelector('[data-field="name"]').value, 'Changed');
    button(m.root, 'close').click();
    button(m.root, 'discard').click();
    assert.equal(m.root.querySelector('[role="dialog"]'), null);
    assert.equal(b.writes.length, 0);
  } finally {
    await m.close();
  }
});
test('parallel save clicks issue exactly one mutation', async () => {
  const b = backend();
  const save = b.hass.callApi;
  b.hass.callApi = async (...args) => {
    await new Promise((r) => setTimeout(r, 25));
    return save(...args);
  };
  const m = await mount(b);
  try {
    button(m.root, 'new').click();
    button(m.root, 'save').click();
    button(m.root, 'save').click();
    await new Promise((r) => setTimeout(r, 70));
    assert.equal(b.writes.length, 1);
  } finally {
    await m.close();
  }
});
test('complex schedules are visible without a destructive edit button', async () => {
  const { schedule } = fixture();
  schedule.weekdays = ['daily'];
  schedule.timeslots[0].conditions = [{ entity_id: 'binary_sensor.window', value: 'off' }];
  const m = await mount(backend([schedule]));
  try {
    assert.match(m.root.textContent, /zusätzliche Bedingungen/);
    assert.equal(button(m.root, 'edit'), null);
    assert.equal(button(m.root, 'copy'), null);
  } finally {
    await m.close();
  }
});
test('all backend labels render as text, not injected markup', async () => {
  const { schedule } = fixture();
  schedule.weekdays = ['daily'];
  schedule.name = '<img src=x onerror=alert(1)>';
  const b = backend([schedule]);
  b.hass.areas.bath.name = '<script>attack</script>';
  const m = await mount(b);
  try {
    assert.equal(m.root.querySelector('img'), null);
    assert.equal(m.root.querySelector('script'), null);
    assert.match(m.root.textContent, /<img src=x/);
  } finally {
    await m.close();
  }
});
test('disconnected cards unsubscribe from server updates', async () => {
  const b = backend();
  const m = await mount(b);
  assert.equal(b.subscribers.size, 1);
  await m.close();
  assert.equal(b.subscribers.size, 0);
});
test('visual configuration emits selected thermostat IDs', async () => {
  const b = backend();
  const m = await mount(b);
  try {
    const editor = m.w.document.createElement('heatingplan-card-editor');
    editor.setConfig({ type: 'custom:heatingplan-card' });
    editor.hass = b.hass;
    m.w.document.body.append(editor);
    let config;
    editor.addEventListener('config-changed', (event) => (config = event.detail.config));
    const all = editor.shadowRoot.querySelector('#all');
    all.checked = false;
    all.dispatchEvent(new m.w.Event('change', { bubbles: true }));
    assert.deepEqual(Array.from(config.entities), ['climate.test']);
    editor.remove();
  } finally {
    await m.close();
  }
});

test('deleting a plan requires confirmation and verifies removal', async () => {
  const { schedule } = fixture();
  schedule.weekdays = ['daily'];
  const b = backend([schedule]);
  const m = await mount(b);
  try {
    button(m.root, 'delete').click();
    assert.equal(b.writes.length, 0);
    assert.ok(button(m.root, 'confirm-delete'));
    button(m.root, 'close').click();
    assert.equal(b.schedules.length, 1);
    button(m.root, 'delete').click();
    button(m.root, 'confirm-delete').click();
    await settle();
    assert.equal(b.schedules.length, 0);
    assert.match(m.root.querySelector('[role="status"]').textContent, /gelöscht/);
  } finally {
    await m.close();
  }
});
