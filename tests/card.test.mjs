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

async function mountEditor() {
  const b = backend();
  for (let i = 0; i < 40; i++) {
    const id = `climate.room_${i}`;
    b.hass.states[id] = {
      entity_id: id,
      state: 'heat',
      attributes: { friendly_name: `Raum ${String(i).padStart(2, '0')} Thermostat`, current_temperature: 20 },
    };
  }
  const m = await mount(b);
  const editor = m.w.document.createElement('heatingplan-card-editor');
  editor.setConfig({ type: 'custom:heatingplan-card', title: 'Unser Heizplan', entities: ['climate.test'] });
  editor.hass = b.hass;
  m.w.document.body.append(editor);
  return { ...m, b, editor, editorRoot: editor.shadowRoot };
}

test('editor retains scroll, focused row and DOM nodes across repeated hass updates', async () => {
  const m = await mountEditor();
  try {
    const list = m.editorRoot.querySelector('.rooms');
    const row = m.editorRoot.querySelector('[data-id="climate.room_25"]');
    row.focus();
    list.scrollTop = 650;
    for (let i = 0; i < 8; i++)
      m.editor.hass = {
        ...m.b.hass,
        states: {
          ...m.b.hass.states,
          'sensor.tick': { entity_id: 'sensor.tick', state: String(i), attributes: {} },
        },
      };
    assert.ok(m.editorRoot.querySelector('.rooms') === list, 'scroll container must be retained');
    assert.ok(m.editorRoot.querySelector('[data-id="climate.room_25"]') === row, 'row must be retained');
    assert.equal(list.scrollTop, 650);
    assert.ok(m.editorRoot.activeElement === row, 'focused row must be retained');
  } finally {
    m.editor.remove();
    await m.close();
  }
});

test('editor keeps scroll when Home Assistant echoes a changed checkbox configuration', async () => {
  const m = await mountEditor();
  try {
    const list = m.editorRoot.querySelector('.rooms');
    list.scrollTop = 480;
    m.editor.addEventListener('config-changed', (event) => m.editor.setConfig(event.detail.config));
    const input = m.editorRoot.querySelector('[data-id="climate.room_25"]');
    input.checked = true;
    input.dispatchEvent(new m.w.Event('change', { bubbles: true }));
    assert.ok(m.editorRoot.querySelector('.rooms') === list, 'scroll container must be retained');
    assert.equal(list.scrollTop, 480);
    assert.equal(input.checked, true);
    assert.equal(m.editorRoot.querySelector('[data-id="climate.test"]').checked, true);
  } finally {
    m.editor.remove();
    await m.close();
  }
});

test('editor leaves an uncommitted title and selection intact during state updates', async () => {
  const m = await mountEditor();
  try {
    const title = m.editorRoot.querySelector('#title');
    title.focus();
    title.value = 'Noch nicht fertig';
    title.setSelectionRange(5, 10);
    m.editor.hass = { ...m.b.hass };
    m.editor.setConfig({
      type: 'custom:heatingplan-card',
      title: 'Unser Heizplan',
      entities: ['climate.test'],
    });
    assert.ok(m.editorRoot.querySelector('#title') === title, 'title input must be retained');
    assert.equal(title.value, 'Noch nicht fertig');
    assert.equal(title.selectionStart, 5);
    assert.equal(title.selectionEnd, 10);
    assert.ok(m.editorRoot.activeElement === title, 'title focus must be retained');
  } finally {
    m.editor.remove();
    await m.close();
  }
});

test('editor refreshes renamed rooms without resetting scroll or losing focused entity', async () => {
  const m = await mountEditor();
  try {
    const list = m.editorRoot.querySelector('.rooms');
    list.scrollTop = 450;
    m.editorRoot.querySelector('[data-id="climate.room_25"]').focus();
    m.editor.hass = {
      ...m.b.hass,
      states: {
        ...m.b.hass.states,
        'climate.room_25': {
          ...m.b.hass.states['climate.room_25'],
          attributes: { friendly_name: 'Neuer Raumname' },
        },
      },
    };
    assert.ok(m.editorRoot.querySelector('.rooms') === list, 'scroll container must be retained');
    assert.equal(list.scrollTop, 450);
    assert.equal(m.editorRoot.activeElement.dataset.id, 'climate.room_25');
    assert.match(m.editorRoot.textContent, /Neuer Raumname/);
  } finally {
    m.editor.remove();
    await m.close();
  }
});

test('card keeps its DOM across unrelated hass updates and repeated scheduler snapshots', async () => {
  const { schedule } = fixture();
  schedule.weekdays = ['daily'];
  const b = backend([schedule]);
  const m = await mount(b);
  try {
    const app = m.root.querySelector('.app');
    for (let i = 0; i < 5; i++) {
      m.card.hass = {
        ...b.hass,
        states: {
          ...b.hass.states,
          'sensor.tick': { entity_id: 'sensor.tick', state: String(i), attributes: {} },
        },
      };
      b.emit();
      await settle();
      assert.ok(m.root.querySelector('.app') === app, 'unchanged card content must not be rebuilt');
    }
    m.card.hass = {
      ...b.hass,
      states: {
        ...b.hass.states,
        'climate.test': {
          ...b.hass.states['climate.test'],
          attributes: { ...b.hass.states['climate.test'].attributes, current_temperature: 22.5 },
        },
      },
    };
    await settle();
    assert.match(m.root.querySelector('.readings').textContent, /22,5/);
  } finally {
    await m.close();
  }
});

test('card restores preview and document scrolling across shadow-root boundaries', async () => {
  const m = await mount(backend());
  try {
    const host = m.w.document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const scroller = m.w.document.createElement('div');
    shadow.append(scroller);
    m.w.document.body.append(host);
    scroller.append(m.card);
    await settle();
    scroller.scrollTop = 370;
    host.scrollTop = 120;
    m.w.document.documentElement.scrollTop = 210;
    const descriptor = Object.getOwnPropertyDescriptor(m.w.ShadowRoot.prototype, 'innerHTML');
    Object.defineProperty(m.root, 'innerHTML', {
      get() {
        return descriptor.get.call(this);
      },
      set(value) {
        descriptor.set.call(this, value);
        scroller.scrollTop = 0;
        host.scrollTop = 0;
        m.w.document.documentElement.scrollTop = 0;
      },
    });
    m.card.setConfig({ type: 'custom:heatingplan-card', title: 'Changed preview title' });
    await settle();
    assert.equal(scroller.scrollTop, 370);
    assert.equal(host.scrollTop, 120);
    assert.equal(m.w.document.documentElement.scrollTop, 210);
    host.remove();
  } finally {
    await m.close();
  }
});
