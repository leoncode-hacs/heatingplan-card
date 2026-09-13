// SPDX-License-Identifier: GPL-3.0-only
// Copyright 2026 Heating Plan Card contributors
import type { Hass, Room, Schedule, ScheduleSlot } from './types.ts';
import { currentClock, editProblem, isEnabled, minutes, targets } from './model.ts';
import { addDays, localDate, scheduleDay, type CalendarWeek } from './calendar.ts';

export interface Upcoming {
  date: string;
  minute: number;
  order: number;
  plan: Schedule;
  slot: ScheduleSlot;
}
export interface RoomOverview {
  room: Room;
  next?: Upcoming;
  status: 'next' | 'none' | 'paused' | 'unknown' | 'conflict' | 'later';
  paused: number;
  unavailable: boolean;
}
export function upcomingDates(hass: Hass, now = new Date()): string[] {
  const today = localDate(hass, now);
  return Array.from({ length: 8 }, (_, index) => addDays(today, index));
}

// A compact forecast of planned actions, not a promise of physical heating.
// An uncertain earlier action must never be hidden behind a later known one.
export function roomOverview(
  rooms: Room[],
  schedules: Schedule[],
  hass: Hass,
  calendar: CalendarWeek,
  now = new Date(),
): RoomOverview[] {
  const dates = upcomingDates(hass, now),
    current = currentClock(hass, now).minute;
  return rooms
    .map((room): RoomOverview => {
      const plans = schedules.filter((plan) => targets(plan).includes(room.id));
      const active = plans.filter((plan) => isEnabled(plan, hass));
      const unavailablePlan = plans.some((plan) =>
        ['unknown', 'unavailable'].includes(hass.states[plan.entity_id]?.state),
      );
      const paused = plans.filter(
        (plan) =>
          !isEnabled(plan, hass) && !['unknown', 'unavailable'].includes(hass.states[plan.entity_id]?.state),
      ).length;
      const base = { room, paused, unavailable: ['unknown', 'unavailable'].includes(room.state.state) };
      if (unavailablePlan) return { ...base, status: 'unknown' };
      if (!active.length) return { ...base, status: plans.length ? 'paused' : 'none' };
      let uncertain = Infinity;
      const events: Upcoming[] = [];
      for (const plan of active) {
        for (const [offset, date] of dates.entries()) {
          const match = scheduleDay(plan, date, calendar);
          if (match === 'no') continue;
          if (editProblem(plan)) {
            uncertain = Math.min(uncertain, offset * 1440);
            continue;
          }
          for (const slot of plan.timeslots) {
            const minute = minutes(slot.start),
              order = offset * 1440 + minute;
            if (order <= current) continue;
            if (match === 'unknown') uncertain = Math.min(uncertain, order);
            else events.push({ date, minute, order, plan, slot });
          }
        }
      }
      events.sort((a, b) => a.order - b.order);
      const next = events[0];
      if (uncertain <= (next?.order ?? Infinity) && Number.isFinite(uncertain))
        return { ...base, status: 'unknown' };
      if (!next) return { ...base, status: 'later' };
      // Scheduler has no defined winner for overlapping plans on one day.
      const concurrent = active.filter((plan) => scheduleDay(plan, next.date, calendar) === 'yes').length > 1;
      return { ...base, next, status: concurrent ? 'conflict' : 'next' };
    })
    .sort(
      (a, b) =>
        (a.next?.order ?? Infinity) - (b.next?.order ?? Infinity) ||
        a.room.name.localeCompare(b.room.name, 'de'),
    );
}
