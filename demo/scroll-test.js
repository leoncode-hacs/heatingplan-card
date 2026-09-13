const editor = document.querySelector('heatingplan-card-editor');
const card = document.querySelector('heatingplan-card');
const states = {};
for (let i = 0; i < 60; i++) {
  const id = `climate.test_${String(i).padStart(2, '0')}`;
  states[id] = {
    entity_id: id,
    state: 'heat',
    attributes: {
      friendly_name: `Raum ${String(i).padStart(2, '0')} · Thermostat`,
      temperature: 21,
      current_temperature: 20,
      min_temp: 5,
      max_temp: 30,
      target_temp_step: 0.5,
    },
  };
}
const schedule = {
  schedule_id: 'demo',
  entity_id: 'switch.schedule_demo',
  name: 'Scrolltest-Heizplan',
  weekdays: ['daily'],
  enabled: true,
  repeat_type: 'repeat',
  tags: [],
  timeslots: Array.from({ length: 8 }, (_, i) => ({
    start: `${String(i * 3).padStart(2, '0')}:00:00`,
    stop: `${String(((i + 1) * 3) % 24).padStart(2, '0')}:00:00`,
    actions: [
      {
        entity_id: 'climate.test_00',
        service: 'climate.set_temperature',
        service_data: { temperature: i % 2 ? 21 : 18 },
      },
    ],
  })),
};
states[schedule.entity_id] = { entity_id: schedule.entity_id, state: 'on', attributes: {} };
let config = { type: 'custom:heatingplan-card', title: 'Scrolltest-Heizplan', entities: ['climate.test_00'] };
const hass = {
  states,
  config: { time_zone: 'Europe/Berlin', unit_system: { temperature: '°C' } },
  callWS: async (msg) => structuredClone(msg.type === 'scheduler' ? [schedule] : schedule),
  callApi: async () => {
    throw new Error('Dieser Scrolltest erlaubt keine Planänderungen.');
  },
  callService: async () => {
    throw new Error('Dieser Scrolltest erlaubt keine Heizungsänderungen.');
  },
};
editor.setConfig(config);
editor.hass = hass;
card.setConfig(config);
card.hass = hass;
editor.addEventListener('config-changed', (event) => {
  config = event.detail.config;
  editor.setConfig(config);
  card.setConfig(config);
});
let updates = 0,
  paused = false;
setInterval(() => {
  if (paused) return;
  updates++;
  const next = {
    ...hass,
    states: {
      ...states,
      'sensor.tick': { entity_id: 'sensor.tick', state: String(updates), attributes: {} },
      'climate.test_00': {
        ...states['climate.test_00'],
        attributes: { ...states['climate.test_00'].attributes, current_temperature: 20 + (updates % 3) / 10 },
      },
    },
  };
  editor.hass = next;
  card.hass = next;
  document.querySelector('#updates').textContent = String(updates);
}, 300);
document.querySelector('#pause').onclick = (event) => {
  paused = !paused;
  event.target.textContent = paused ? 'Statusupdates fortsetzen' : 'Statusupdates pausieren';
};
