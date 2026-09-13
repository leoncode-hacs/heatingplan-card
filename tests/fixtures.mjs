export const clone = (value) => structuredClone(value);
export function fixture() {
  const entity = 'climate.test';
  const hass = {
    states: {
      [entity]: {
        entity_id: entity,
        state: 'heat',
        attributes: {
          friendly_name: 'Thermostat',
          temperature: 21,
          current_temperature: 20,
          min_temp: 5,
          max_temp: 30,
          target_temp_step: 0.5,
          hvac_modes: ['heat', 'off'],
        },
      },
      'switch.plan': { entity_id: 'switch.plan', state: 'on', attributes: {} },
    },
    entities: { [entity]: { device_id: 'device' } },
    devices: { device: { area_id: 'bath' } },
    areas: { bath: { name: 'Bad' } },
    config: { time_zone: 'Europe/Berlin', unit_system: { temperature: '°C' } },
  };
  const schedule = {
    schedule_id: 'plan',
    entity_id: 'switch.plan',
    enabled: true,
    name: 'Wärme',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    repeat_type: 'repeat',
    tags: ['private-tag'],
    start_date: null,
    end_date: null,
    timeslots: [
      {
        start: '00:00:00',
        stop: '07:00:00',
        conditions: [],
        track_conditions: false,
        condition_type: null,
        actions: [
          { service: 'climate.set_temperature', entity_id: entity, service_data: { temperature: 17 } },
        ],
      },
      {
        start: '07:00:00',
        stop: '00:00:00',
        conditions: [],
        track_conditions: false,
        condition_type: null,
        actions: [
          { service: 'climate.set_temperature', entity_id: entity, service_data: { temperature: 21 } },
        ],
      },
    ],
  };
  return { hass, schedule, entity };
}
export function backend(initial = []) {
  const { hass } = fixture();
  let data = clone(initial),
    writes = [],
    subscribers = new Set(),
    counter = 0;
  const normalize = (slot) => ({
    start: slot.start,
    stop: slot.stop ?? null,
    conditions: slot.conditions ?? [],
    condition_type: slot.condition_type ?? null,
    track_conditions: slot.track_conditions ?? false,
    actions: slot.actions.map((a) => ({
      service: a.service,
      entity_id: a.entity_id,
      service_data: a.service_data ?? {},
    })),
  });
  hass.callWS = async (m) =>
    m.type === 'scheduler' ? clone(data) : clone(data.find((s) => s.schedule_id === m.schedule_id));
  hass.callApi = async (method, path, payload) => {
    writes.push({ method, path, payload: clone(payload) });
    if (path === 'scheduler/remove') {
      data = data.filter((s) => s.schedule_id !== payload.schedule_id);
      return { success: true };
    }
    if (path === 'scheduler/edit') {
      const index = data.findIndex((s) => s.schedule_id === payload.schedule_id);
      data[index] = { ...data[index], ...clone(payload), timeslots: payload.timeslots.map(normalize) };
    } else {
      const id = `new${++counter}`;
      data.push({
        ...clone(payload),
        schedule_id: id,
        entity_id: `switch.${id}`,
        enabled: true,
        timeslots: payload.timeslots.map(normalize),
      });
    }
    return { success: true };
  };
  hass.callService = async (domain, service, payload) => {
    writes.push({ domain, service, payload });
    if (domain === 'switch') {
      data.find((s) => s.entity_id === payload.entity_id).enabled = service === 'turn_on';
      hass.states[payload.entity_id] = {
        entity_id: payload.entity_id,
        state: service === 'turn_on' ? 'on' : 'off',
        attributes: {},
      };
    } else {
      if (payload.temperature !== undefined)
        hass.states[payload.entity_id].attributes.temperature = payload.temperature;
      if (payload.hvac_mode) hass.states[payload.entity_id].state = payload.hvac_mode;
    }
  };
  hass.connection = {
    subscribeMessage: async (cb) => {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
  };
  return {
    hass,
    writes,
    subscribers,
    get schedules() {
      return data;
    },
    replace(list) {
      data = clone(list);
    },
    emit() {
      for (const cb of subscribers) cb({});
    },
  };
}
