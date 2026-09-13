// SPDX-License-Identifier: GPL-3.0-only
// Copyright 2026 Heating Plan Card contributors
import type { Draft, Hass, Schedule } from './types.ts';
import { conflicts, editProblem, fingerprint, payload, targets, toDraft, validateDraft } from './model.ts';
export class SchedulerApi {
  private hass: () => Hass;
  constructor(hass: () => Hass) {
    this.hass = hass;
  }
  async list(): Promise<Schedule[]> {
    const response = await this.hass().callWS<unknown>({ type: 'scheduler' });
    if (!Array.isArray(response))
      throw new Error('Die Scheduler-Integration liefert ein unbekanntes Antwortformat.');
    if (
      response.some(
        (s) =>
          !s ||
          typeof s.schedule_id !== 'string' ||
          !Array.isArray(s.timeslots) ||
          !Array.isArray(s.weekdays),
      )
    )
      throw new Error('Die Zeitpläne konnten nicht sicher gelesen werden.');
    return response as Schedule[];
  }
  async item(id: string): Promise<Schedule> {
    const response = await this.hass().callWS<Schedule>({ type: 'scheduler/item', schedule_id: id });
    if (!response || response.schedule_id !== id || !Array.isArray(response.timeslots))
      throw new Error('Der Heizplan ist nicht mehr verfügbar. Bitte neu laden.');
    return response;
  }
  async save(draft: Draft, original?: Schedule): Promise<Schedule[]> {
    const problem = validateDraft(draft, this.hass());
    if (problem) throw new Error(problem);
    const fresh = await this.list();
    let willBeActive = true;
    if (original) {
      const latest = await this.item(original.schedule_id);
      willBeActive = latest.enabled !== false;
      if (fingerprint(latest) !== fingerprint(original) || editProblem(latest))
        throw new Error(
          'Dieser Plan wurde inzwischen geändert. Bitte schließe den Editor und öffne den aktuellen Stand.',
        );
    }
    const overlapping = conflicts(draft, fresh, this.hass(), original?.schedule_id);
    if (overlapping.length && willBeActive)
      throw new Error(
        'Für diese Tage ist bereits ein anderer Heizplan aktiv. Bitte pausiere ihn zuerst oder wähle andere Tage.',
      );
    const config = payload(draft, original);
    // A failed write is never retried automatically: its result may be uncertain.
    const response = await this.hass().callApi<unknown>(
      'POST',
      original ? 'scheduler/edit' : 'scheduler/add',
      config,
    );
    if (
      response === false ||
      (response &&
        typeof response === 'object' &&
        'success' in response &&
        (response as { success: unknown }).success === false)
    )
      throw new Error('Die Scheduler-Integration hat den Heizplan nicht gespeichert.');
    const signature = (d: Draft) =>
      JSON.stringify([
        d.name.trim(),
        d.entity,
        [...d.weekdays].sort(),
        d.periods.map((p) =>
          p.mode === 'off' ? [p.start, 'off'] : [p.start, p.mode || 'temperature', p.temperature],
        ),
      ]);
    const expectedDraft: Draft = {
      ...draft,
      periods: draft.periods.map((p) =>
        p.mode !== 'off' && draft.periods.some((period) => period.mode === 'off')
          ? { ...p, mode: 'heat' }
          : p,
      ),
    };
    for (const delay of [0, 100, 250, 500, 1000]) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      const result = await this.list();
      const found = result.find(
        (s) =>
          (original
            ? s.schedule_id === original.schedule_id
            : !fresh.some((previous) => previous.schedule_id === s.schedule_id)) &&
          !editProblem(s) &&
          signature(toDraft(s)) === signature(expectedDraft),
      );
      if (found) return result;
    }
    throw new Error(
      'Der Speicherauftrag wurde gesendet, konnte aber noch nicht bestätigt werden. Bitte neu laden, bevor du erneut speicherst.',
    );
  }

  async remove(schedule: Schedule): Promise<Schedule[]> {
    const fresh = await this.item(schedule.schedule_id);
    if (fingerprint(fresh) !== fingerprint(schedule))
      throw new Error('Dieser Plan wurde inzwischen geändert. Bitte prüfe ihn erneut.');
    const response = await this.hass().callApi<{ success: boolean }>('POST', 'scheduler/remove', {
      schedule_id: schedule.schedule_id,
    });
    if (!response?.success) throw new Error('Der Heizplan wurde nicht gelöscht.');
    for (const delay of [0, 100, 250, 500, 1000]) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      const schedules = await this.list();
      if (!schedules.some((s) => s.schedule_id === schedule.schedule_id)) return schedules;
    }
    throw new Error('Der Löschauftrag wurde gesendet. Bitte lade neu, um das Ergebnis zu prüfen.');
  }

  async toggle(schedule: Schedule, enabled: boolean): Promise<void> {
    const current = await this.item(schedule.schedule_id);
    if (current.entity_id !== schedule.entity_id)
      throw new Error('Der Plan wurde verändert. Bitte neu laden.');
    if (enabled) {
      const schedules = await this.list();
      const other = targets(current).flatMap((entity) =>
        conflicts(
          {
            name: '',
            entity,
            weekdays: current.weekdays,
            periods: [],
          },
          schedules,
          this.hass(),
          current.schedule_id,
        ),
      );
      if (other.length)
        throw new Error('Ein anderer Plan für diese Tage ist bereits aktiv. Bitte pausiere ihn zuerst.');
    }
    await this.hass().callService('switch', enabled ? 'turn_on' : 'turn_off', {
      entity_id: current.entity_id,
    });
  }
}
