// SPDX-License-Identifier: GPL-3.0-only
// Copyright 2026 Heating Plan Card contributors
export interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
}
export interface Hass {
  states: Record<string, EntityState>;
  entities?: Record<string, { area_id?: string | null; device_id?: string | null }>;
  devices?: Record<string, { area_id?: string | null; name?: string; name_by_user?: string }>;
  areas?: Record<string, { name: string }>;
  config?: { time_zone?: string; unit_system?: { temperature?: string } };
  locale?: { language?: string };
  language?: string;
  callWS<T>(message: Record<string, unknown>): Promise<T>;
  callApi<T>(method: string, path: string, data?: unknown): Promise<T>;
  callService(domain: string, service: string, data: Record<string, unknown>): Promise<unknown>;
  connection?: {
    subscribeMessage(
      callback: (event: unknown) => void,
      message: Record<string, unknown>,
    ): Promise<() => void>;
  };
}
export interface CardConfig {
  type: string;
  title?: string;
  entities?: string[];
  language?: 'de' | 'en';
}
export interface ScheduleAction {
  entity_id?: string;
  service: string;
  service_data?: Record<string, unknown>;
}
export interface ScheduleSlot {
  start: string;
  stop?: string;
  actions: ScheduleAction[];
  conditions?: unknown[];
  condition_type?: string;
  track_conditions?: boolean;
}
export interface Schedule {
  schedule_id: string;
  entity_id: string;
  name?: string;
  weekdays: string[];
  timeslots: ScheduleSlot[];
  enabled?: boolean;
  repeat_type?: string;
  start_date?: string | null;
  end_date?: string | null;
  tags?: string[];
  timestamps?: string[];
  next_entries?: number[];
  [key: string]: unknown;
}
export interface Period {
  start: number;
  temperature: number;
}
export interface Draft {
  name: string;
  entity: string;
  weekdays: string[];
  periods: Period[];
}
export interface Room {
  id: string;
  name: string;
  detail: string;
  state: EntityState;
}
