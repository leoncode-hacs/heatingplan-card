const clone = (value) => structuredClone(value);
const card = document.querySelector('heatingplan-card');
const state = (id, name, current, target, heating = false) => ({
  entity_id: id,
  state: 'heat',
  attributes: {
    friendly_name: name,
    current_temperature: current,
    temperature: target,
    min_temp: 5,
    max_temp: 30,
    target_temp_step: 0.5,
    hvac_action: heating ? 'heating' : 'idle',
  },
});
const makePlan = (id, entity, name, days, points) => ({
  schedule_id: id,
  entity_id: `switch.schedule_${id}`,
  name,
  weekdays: days,
  repeat_type: 'repeat',
  enabled: true,
  tags: ['heatingplan-card'],
  timeslots: points.map(([start, temp], i) => ({
    start: `${start}:00`,
    stop: `${points[i + 1]?.[0] || '00:00'}:00`,
    actions: [{ service: 'climate.set_temperature', entity_id: entity, service_data: { temperature: temp } }],
  })),
});
let plans = [
  makePlan(
    'livingweek',
    'climate.living',
    'Entspannt durch die Woche',
    ['mon', 'tue', 'wed', 'thu', 'fri'],
    [
      ['00:00', 17],
      ['06:30', 21],
      ['09:00', 18],
      ['17:00', 21],
      ['22:00', 17],
    ],
  ),
  makePlan(
    'livingend',
    'climate.living',
    'Gemütliches Wochenende',
    ['sat', 'sun'],
    [
      ['00:00', 17],
      ['08:00', 21],
      ['23:00', 17],
    ],
  ),
  makePlan(
    'bath',
    'climate.bath',
    'Ein warmer Start',
    ['daily'],
    [
      ['00:00', 18],
      ['06:00', 23],
      ['08:00', 19],
      ['19:00', 22],
      ['22:00', 18],
    ],
  ),
  makePlan(
    'bed',
    'climate.bed',
    'Angenehm schlafen',
    ['daily'],
    [
      ['00:00', 17],
      ['07:00', 19],
      ['09:00', 17],
      ['21:00', 18],
    ],
  ),
];
let listeners = new Set();
const hass = {
  states: {
    'climate.living': state('climate.living', 'Thermostat', 20.5, 21, true),
    'climate.bath': state('climate.bath', 'Thermostat', 22, 23, true),
    'climate.bed': state('climate.bed', 'Thermostat', 18.2, 17),
    'climate.office': state('climate.office', 'Thermostat', 19.5, 19),
  },
  entities: {
    'climate.living': { area_id: 'living' },
    'climate.bath': { area_id: 'bath' },
    'climate.bed': { area_id: 'bed' },
    'climate.office': { area_id: 'office' },
  },
  areas: {
    living: { name: 'Wohnzimmer' },
    bath: { name: 'Badezimmer' },
    bed: { name: 'Schlafzimmer' },
    office: { name: 'Arbeitszimmer' },
  },
  devices: {},
  language: 'de',
  config: { time_zone: 'Europe/Berlin', unit_system: { temperature: '°C' } },
  connection: {
    subscribeMessage: async (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  },
  callWS: async (msg) => {
    await new Promise((r) => setTimeout(r, 80));
    if (msg.type === 'scheduler') return clone(plans);
    if (msg.type === 'scheduler/item')
      return clone(plans.find((plan) => plan.schedule_id === msg.schedule_id));
    throw new Error('Unbekannte Anfrage');
  },
  callApi: async (method, path, data) => {
    await new Promise((r) => setTimeout(r, 160));
    if (path === 'scheduler/add') {
      const id = crypto.randomUUID().slice(0, 6);
      plans.push({ ...clone(data), schedule_id: id, entity_id: `switch.schedule_${id}`, enabled: true });
    } else if (path === 'scheduler/remove') {
      plans = plans.filter((plan) => plan.schedule_id !== data.schedule_id);
    } else if (path === 'scheduler/edit') {
      const index = plans.findIndex((plan) => plan.schedule_id === data.schedule_id);
      plans[index] = { ...plans[index], ...clone(data) };
    } else throw new Error('Unbekannte Aktion');
    sync();
    return true;
  },
  callService: async (domain, service, data) => {
    await new Promise((r) => setTimeout(r, 100));
    if (domain === 'switch') {
      const plan = plans.find((plan) => plan.entity_id === data.entity_id);
      plan.enabled = service === 'turn_on';
    }
    if (domain === 'climate') hass.states[data.entity_id].attributes.temperature = data.temperature;
    sync();
  },
};
function sync() {
  for (const plan of plans)
    hass.states[plan.entity_id] = {
      entity_id: plan.entity_id,
      state: plan.enabled ? 'on' : 'off',
      attributes: {},
    };
  hass.states = { ...hass.states };
  card.hass = { ...hass };
  for (const listener of listeners) listener({});
}
card.setConfig({ type: 'custom:heatingplan-card', title: 'Unser Heizplan' });
sync();
document.querySelector('#mobile').onclick = () => document.querySelector('#wrapper').classList.add('mobile');
document.querySelector('#desktop').onclick = () =>
  document.querySelector('#wrapper').classList.remove('mobile');
document.querySelector('#theme').onclick = () => document.body.classList.toggle('dark');
