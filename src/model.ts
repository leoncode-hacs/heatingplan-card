// SPDX-License-Identifier: GPL-3.0-only
// Copyright 2026 Heating Plan Card contributors
import type { Draft, Hass, Period, Room, Schedule } from './types.ts';
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const SHORT_DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export function minutes(value: string): number {
  const match = /^(\d{2}):(\d{2})(?::00)?$/.exec(value);
  if (!match) return NaN;
  const h = Number(match[1]),
    m = Number(match[2]);
  return h === 24 && m === 0 ? 1440 : h < 24 && m < 60 ? h * 60 + m : NaN;
}
export function endMinutes(value: string): number {
  return value === '00:00:00' || value === '00:00' || value === '23:59:59' ? 1440 : minutes(value);
}
export function clock(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
export function temperature(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('de-DE', { maximumFractionDigits: 1 })
    : '–';
}
export function roomList(hass: Hass, configured?: string[]): Room[] {
  const ids = configured ?? Object.keys(hass.states).filter((id) => id.startsWith('climate.'));
  const rooms = ids
    .map((id) => {
      const state = hass.states[id];
      if (!state || !id.startsWith('climate.')) return null;
      const entry = hass.entities?.[id];
      const areaId =
        entry?.area_id || (entry?.device_id ? hass.devices?.[entry.device_id]?.area_id : undefined);
      const area = areaId ? hass.areas?.[areaId]?.name : undefined;
      const friendly = String(state.attributes.friendly_name || id.slice(8).replaceAll('_', ' '));
      return { id, name: area || friendly, detail: area && area !== friendly ? friendly : id, state };
    })
    .filter((room): room is Room => room !== null);
  for (const room of rooms)
    if (rooms.filter((other) => other.name === room.name).length > 1)
      room.detail = `${room.detail} · ${room.id}`;
  return rooms.sort((a, b) => a.name.localeCompare(b.name, 'de'));
}
export function targets(schedule: Schedule): string[] {
  return [
    ...new Set(
      (schedule.timeslots || [])
        .flatMap((slot) => (slot.actions || []).map((action) => action.entity_id))
        .filter((id): id is string => typeof id === 'string'),
    ),
  ];
}
export function dayLabel(days: string[]): string {
  if (days.includes('daily') || DAYS.every((day) => days.includes(day))) return 'Jeden Tag';
  if (days.length === 5 && DAYS.slice(0, 5).every((day) => days.includes(day))) return 'Montag bis Freitag';
  if (days.length === 2 && days.includes('sat') && days.includes('sun')) return 'Wochenende';
  if (days.includes('workday')) return 'Arbeitstage (Arbeitskalender)';
  if (days.includes('weekend')) return 'Freie Tage (Arbeitskalender)';
  return DAYS.filter((day) => days.includes(day))
    .map((day) => SHORT_DAYS[DAYS.indexOf(day)])
    .join(', ');
}
export function applies(schedule: Pick<Schedule, 'weekdays'>, day: number): boolean {
  return schedule.weekdays.includes('daily') || schedule.weekdays.includes(DAYS[day]);
}
export function isEnabled(schedule: Schedule, hass: Hass): boolean {
  const state = hass.states[schedule.entity_id]?.state;
  return state !== undefined ? state === 'on' || state === 'triggered' : schedule.enabled !== false;
}
export function limits(hass: Hass, entity: string) {
  const a = hass.states[entity]?.attributes || {};
  return {
    min: Number.isFinite(a.min_temp) ? a.min_temp : 5,
    max: Number.isFinite(a.max_temp) ? a.max_temp : 30,
    step: Number.isFinite(a.target_temp_step) && a.target_temp_step > 0 ? a.target_temp_step : 0.5,
  };
}
// Only complete, plain temperature schedules are writable by the simple editor.
// Other schedules remain visible and retain their full backend configuration.
export function editProblem(schedule: Schedule): string | null {
  if (targets(schedule).length !== 1 || !targets(schedule)[0]?.startsWith('climate.'))
    return 'Dieser Plan steuert mehrere Geräte oder andere Aktionen.';
  if (schedule.repeat_type && schedule.repeat_type !== 'repeat')
    return 'Dieser Plan hat eine besondere Wiederholungsregel.';
  if (schedule.start_date || schedule.end_date) return 'Dieser Plan gilt nur in einem bestimmten Zeitraum.';
  if (
    !schedule.weekdays.length ||
    schedule.weekdays.some((day) => !DAYS.includes(day) && !['daily', 'workday', 'weekend'].includes(day)) ||
    (schedule.weekdays.some((day) => day === 'workday' || day === 'weekend') &&
      schedule.weekdays.length !== 1)
  )
    return 'Dieser Plan kombiniert besondere Kalenderregeln.';
  if (!schedule.timeslots.length) return 'Dieser Plan enthält keine Heizzeiten.';
  let end = 0;
  for (const slot of schedule.timeslots) {
    const action = slot.actions[0];
    if (slot.conditions?.length || slot.track_conditions)
      return 'Dieser Plan enthält zusätzliche Bedingungen.';
    if (
      slot.actions.length !== 1 ||
      action?.service !== 'climate.set_temperature' ||
      !Number.isFinite(action.service_data?.temperature) ||
      Object.keys(action.service_data || {}).some((key) => key !== 'temperature')
    )
      return 'Dieser Plan enthält zusätzliche Einstellungen oder Aktionen.';
    const start = minutes(slot.start),
      stop = slot.stop ? endMinutes(slot.stop) : NaN;
    if (start !== end || !Number.isFinite(stop) || stop <= start)
      return 'Dieser Plan verwendet einzelne Schaltzeiten oder Zeitlücken.';
    end = stop;
  }
  return end === 1440 ? null : 'Dieser Plan deckt nicht den ganzen Tag ab.';
}
export function toDraft(schedule: Schedule): Draft {
  if (editProblem(schedule)) throw new Error('Dieser Plan ist nur zur Ansicht verfügbar.');
  return {
    name: schedule.name || '',
    entity: targets(schedule)[0],
    weekdays: schedule.weekdays.includes('daily') ? [...DAYS] : [...schedule.weekdays],
    periods: schedule.timeslots.map((slot) => ({
      start: minutes(slot.start),
      temperature: Number(slot.actions[0].service_data?.temperature),
    })),
  };
}
export function newDraft(entity: string, hass: Hass): Draft {
  const range = limits(hass, entity);
  const clamp = (c: number) => {
    const v = hass.config?.unit_system?.temperature === '°F' ? c * 1.8 + 32 : c;
    return Math.min(range.max, Math.max(range.min, Math.round(v / range.step) * range.step));
  };
  return {
    name: 'Mein Heizplan',
    entity,
    weekdays: DAYS.slice(0, 5),
    periods: [
      { start: 0, temperature: clamp(17) },
      { start: 390, temperature: clamp(21) },
      { start: 540, temperature: clamp(18) },
      { start: 1020, temperature: clamp(21) },
      { start: 1320, temperature: clamp(17) },
    ],
  };
}
export function validateDraft(draft: Draft, hass: Hass): string | null {
  if (!hass.states[draft.entity] || !draft.entity.startsWith('climate.'))
    return 'Bitte wähle ein vorhandenes Thermostat.';
  if (!draft.name.trim() || draft.name.length > 80)
    return 'Bitte gib einen Namen mit höchstens 80 Zeichen ein.';
  if (
    !draft.weekdays.length ||
    new Set(draft.weekdays).size !== draft.weekdays.length ||
    draft.weekdays.some((day) => !DAYS.includes(day) && !['workday', 'weekend'].includes(day)) ||
    (draft.weekdays.some((day) => day === 'workday' || day === 'weekend') && draft.weekdays.length !== 1)
  )
    return 'Bitte wähle mindestens einen Wochentag.';
  if (!draft.periods.length || draft.periods[0].start !== 0 || draft.periods.length > 24)
    return 'Der Tag muss um 00:00 beginnen und darf höchstens 24 Abschnitte enthalten.';
  const range = limits(hass, draft.entity);
  for (let i = 0; i < draft.periods.length; i++) {
    const p = draft.periods[i];
    if (
      !Number.isInteger(p.start) ||
      p.start < 0 ||
      p.start >= 1440 ||
      (i > 0 && p.start <= draft.periods[i - 1].start)
    )
      return 'Die Uhrzeiten müssen in aufsteigender Reihenfolge liegen und dürfen sich nicht wiederholen.';
    if (!Number.isFinite(p.temperature) || p.temperature < range.min || p.temperature > range.max)
      return `Bitte wähle Temperaturen zwischen ${temperature(range.min)} und ${temperature(range.max)} °C.`;
    if (Math.abs(p.temperature / range.step - Math.round(p.temperature / range.step)) > 0.00001)
      return `Dieses Thermostat unterstützt Schritte von ${temperature(range.step)} °C.`;
  }
  return null;
}
export function payload(draft: Draft, original?: Schedule): Record<string, unknown> {
  return {
    name: draft.name.trim(),
    weekdays: [...draft.weekdays],
    repeat_type: original?.repeat_type || 'repeat',
    tags: original?.tags || ['heatingplan-card'],
    timeslots: draft.periods.map((p, i) => ({
      start: `${clock(p.start)}:00`,
      stop: draft.periods[i + 1] ? `${clock(draft.periods[i + 1].start)}:00` : '00:00:00',
      actions: [
        {
          entity_id: draft.entity,
          service: 'climate.set_temperature',
          service_data: { temperature: p.temperature },
        },
      ],
    })),
    ...(original ? { schedule_id: original.schedule_id } : {}),
  };
}
export function fingerprint(schedule: Schedule): string {
  return JSON.stringify([
    schedule.name,
    schedule.weekdays,
    schedule.timeslots,
    schedule.repeat_type,
    schedule.start_date,
    schedule.end_date,
    schedule.tags,
  ]);
}
export function conflicts(draft: Draft, schedules: Schedule[], hass: Hass, exclude?: string): Schedule[] {
  const overlap = (a: string[], b: string[]) => {
    if (
      (a.length === 1 && a[0] === 'workday' && b.length === 1 && b[0] === 'weekend') ||
      (b.length === 1 && b[0] === 'workday' && a.length === 1 && a[0] === 'weekend')
    )
      return false;
    if ([...a, ...b].some((day) => ['workday', 'weekend', 'daily'].includes(day))) return true;
    return a.some((day) => b.includes(day));
  };
  return schedules.filter(
    (s) =>
      s.schedule_id !== exclude &&
      targets(s).includes(draft.entity) &&
      isEnabled(s, hass) &&
      overlap(draft.weekdays, s.weekdays),
  );
}

export function currentClock(hass: Hass, date = new Date()): { day: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: hass.config?.time_zone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (name: string) => parts.find((p) => p.type === name)?.value || '';
  return {
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(part('weekday')),
    minute: Number(part('hour')) * 60 + Number(part('minute')),
  };
}
export function nextChange(
  schedules: Schedule[],
  hass: Hass,
  entity: string,
): { minutes: number; temperature: number } | undefined {
  const now = currentClock(hass);
  let next: { minutes: number; temperature: number } | undefined;
  for (let offset = 0; offset <= 7; offset++)
    for (const s of schedules) {
      if (
        !isEnabled(s, hass) ||
        !targets(s).includes(entity) ||
        editProblem(s) ||
        !applies(s, (now.day + offset) % 7)
      )
        continue;
      for (const slot of s.timeslots) {
        const distance = offset * 1440 + minutes(slot.start) - now.minute;
        if (distance > 0 && (!next || distance < next.minutes))
          next = { minutes: distance, temperature: Number(slot.actions[0].service_data?.temperature) };
      }
    }
  return next;
}
export function insertPeriod(periods: Period[]): Period[] {
  let index = 0,
    gap = 0;
  periods.forEach((p, i) => {
    const size = (periods[i + 1]?.start ?? 1440) - p.start;
    if (size > gap) {
      gap = size;
      index = i;
    }
  });
  if (gap < 30) return periods;
  const copy = structuredClone(periods);
  copy.splice(index + 1, 0, {
    start: Math.floor((periods[index].start + gap / 2) / 15) * 15,
    temperature: periods[index].temperature,
  });
  return copy;
}
