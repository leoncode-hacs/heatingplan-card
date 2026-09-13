// SPDX-License-Identifier: GPL-3.0-only
// Copyright 2026 Heating Plan Card contributors
import type { Hass, Schedule } from './types.ts';
import { DAYS } from './model.ts';

// Scheduler's published backend uses this entity; do not guess a different
// Workday sensor, which might have a different holiday/working-day calendar.
export const WORKDAY_ENTITY = 'binary_sensor.workday_sensor';
export interface CalendarDay {
  workday: boolean | null;
  source: 'sensor' | 'calendar' | 'standard' | 'unknown';
}
export type CalendarWeek = Record<string, CalendarDay>;
export type DayMatch = 'yes' | 'no' | 'unknown';

export function localDate(hass: Hass, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: hass.config?.time_zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function weekday(date: string): number {
  return (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
}
export function weekDates(hass: Hass, offset = 0, now = new Date()): string[] {
  const today = localDate(hass, now);
  const monday = addDays(today, -weekday(today) + offset * 7);
  return DAYS.map((_, i) => addDays(monday, i));
}
export function shortDate(date: string): string {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}.`;
}
export function calendarWeek(date: string): { week: number; year: number } {
  const thursday = new Date(`${addDays(date, 3 - weekday(date))}T12:00:00Z`);
  const year = thursday.getUTCFullYear();
  const start = new Date(`${year}-01-01T12:00:00Z`);
  return { year, week: Math.ceil(((thursday.getTime() - start.getTime()) / 86400000 + 1) / 7) };
}
export function usesWorkday(schedule: Pick<Schedule, 'weekdays'>): boolean {
  return schedule.weekdays.some((day) => day === 'workday' || day === 'weekend');
}
export function scheduleDay(schedule: Schedule, date: string, calendar: CalendarWeek): DayMatch {
  if ((schedule.start_date && date < schedule.start_date) || (schedule.end_date && date > schedule.end_date))
    return 'no';
  const days = schedule.weekdays;
  if (!days.length || days.includes('daily')) return 'yes';
  if (usesWorkday(schedule)) {
    // The simple editor preserves mixed rules as read-only. Do not pretend to
    // know how another scheduler version resolves a mixed calendar expression.
    if (days.length !== 1) return 'unknown';
    const working = calendar[date]?.workday;
    if (typeof working !== 'boolean') return 'unknown';
    return (days[0] === 'workday' ? working : !working) ? 'yes' : 'no';
  }
  if (days.includes(DAYS[weekday(date)])) return 'yes';
  return days.some((day) => !DAYS.includes(day)) ? 'unknown' : 'no';
}

export function calendarKey(hass: Hass, dates: string[]): string {
  const sensor = hass.states[WORKDAY_ENTITY];
  return JSON.stringify([dates, localDate(hass), hass.config?.time_zone, sensor?.state, sensor?.attributes]);
}
export async function loadCalendarWeek(hass: Hass, dates: string[], timeoutMs = 8000): Promise<CalendarWeek> {
  const sensor = hass.states[WORKDAY_ENTITY];
  const today = localDate(hass);
  const entries = await Promise.all(
    dates.map(async (date) => {
      // Match Scheduler's actual default when no Workday sensor exists.
      if (!sensor) return [date, { workday: weekday(date) < 5, source: 'standard' }] as const;
      if (date === today && (sensor.state === 'on' || sensor.state === 'off'))
        return [date, { workday: sensor.state === 'on', source: 'sensor' }] as const;
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const query = hass.callWS<{ response?: Record<string, { workday?: boolean }> }>({
          type: 'call_service',
          domain: 'workday',
          service: 'check_date',
          service_data: { check_date: date },
          target: { entity_id: WORKDAY_ENTITY },
          return_response: true,
        });
        const result = await Promise.race([
          query,
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error('Calendar timeout')), timeoutMs);
          }),
        ]);
        const workday = result?.response?.[WORKDAY_ENTITY]?.workday;
        if (typeof workday === 'boolean') return [date, { workday, source: 'calendar' }] as const;
      } catch {
        /* Unknown is visible in the UI; it must not hide possible plans. */
      } finally {
        if (timer) clearTimeout(timer);
      }
      return [date, { workday: null, source: 'unknown' }] as const;
    }),
  );
  return Object.fromEntries(entries);
}
