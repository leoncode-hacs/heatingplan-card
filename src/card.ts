// SPDX-License-Identifier: GPL-3.0-only
// Copyright 2026 Heating Plan Card contributors
import type { CardConfig, Draft, Hass, Period, Room, Schedule } from './types.ts';
import {
  DAYS,
  DAY_NAMES,
  SHORT_DAYS,
  clock,
  conflicts,
  currentClock,
  dayLabel,
  endMinutes,
  editProblem,
  fingerprint,
  insertPeriod,
  isEnabled,
  limits,
  minutes,
  newDraft,
  nextChange,
  payload,
  roomList,
  targets,
  temperature,
  temperatureText,
  slotIsOff,
  supportsMode,
  toDraft,
  validateDraft,
} from './model.ts';
import {
  calendarKey,
  calendarWeek,
  loadCalendarWeek,
  localDate,
  scheduleDay,
  shortDate,
  usesWorkday,
  weekDates,
  type CalendarWeek,
  type DayMatch,
} from './calendar.ts';
import { roomOverview, upcomingDates } from './overview.ts';
import { SchedulerApi } from './api.ts';
import { styles } from './styles.ts';
declare const __VERSION__: string;
const escape = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
const paths: Record<string, string> = {
  overview: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  home: 'M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8',
  heat: 'M8 3c-5 6 3 6 0 12m5-12c-5 6 3 6 0 12m5-12c-5 6 3 6 0 12M4 21h16',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M18 6 6 18',
  edit: 'm14 5 5 5M4 20l5-1L21 7l-4-4L5 15z',
  copy: 'M9 8h11v13H9zM5 16H3V3h12v2',
  refresh: 'M20 8a8 8 0 1 0 0 9M20 3v5h-5',
  moon: 'M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12',
  sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  bin: 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',
  check: 'm5 12 4 4L19 6',
  arrow: 'm8 5 7 7-7 7',
  lock: 'M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3',
};
const icon = (name: string) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.home}"/></svg>`;
interface EditSession {
  draft: Draft;
  initial: string;
  original?: Schedule;
  error: string;
  discard: boolean;
}
class HeatingPlanCard extends HTMLElement {
  private root = this.attachShadow({ mode: 'open' });
  private config: CardConfig = { type: 'custom:heatingplan-card' };
  private currentHass?: Hass;
  private schedules: Schedule[] = [];
  private loaded = false;
  private error = '';
  private message = '';
  private busy = false;
  private room = '';
  private day = 0;
  private weekOffset = 0;
  private overview = false;
  private calendar: CalendarWeek = {};
  private calendarKey = '';
  private calendarExpires = 0;
  private calendarRequest = 0;
  private edit?: EditSession;
  private quick?: { value: number; mode: 'heat' | 'off'; error: string };
  private deletion?: { schedule: Schedule; error: string };
  private undo?: { before: Schedule; after: Schedule };
  private unsubscribe?: () => void;
  private subscribing = false;
  private subscribedConnection?: Hass['connection'];
  private refreshId = 0;
  private timer?: ReturnType<typeof setInterval>;
  private queued = false;
  private renderedMarkup = '';
  private api = new SchedulerApi(() => {
    if (!this.currentHass) throw new Error('Home Assistant ist noch nicht verbunden.');
    return this.currentHass;
  });
  constructor() {
    super();
    this.root.addEventListener('click', (event) => void this.handleClick(event));
    this.root.addEventListener('change', (event) => this.change(event));
    this.root.addEventListener('input', (event) => this.input(event));
    this.root.addEventListener('keydown', (event) => this.key(event as KeyboardEvent));
  }
  setConfig(config: CardConfig) {
    if (!config || config.type !== 'custom:heatingplan-card')
      throw new Error('Verwende type: custom:heatingplan-card.');
    if (
      config.entities &&
      (!Array.isArray(config.entities) ||
        config.entities.some((id) => typeof id !== 'string' || !id.startsWith('climate.')))
    )
      throw new Error('entities muss eine Liste von Thermostaten sein.');
    this.config = { ...config };
    this.requestRender();
  }
  set hass(hass: Hass) {
    const first = !this.currentHass;
    this.currentHass = hass;
    if (first) this.day = currentClock(hass).day;
    if (!this.edit && !this.quick && !this.deletion) this.requestRender();
    if (this.isConnected) {
      this.subscribe();
      if (first) void this.refresh();
      void this.refreshCalendar();
    }
  }
  get hass() {
    return this.currentHass!;
  }
  getCardSize() {
    return 9;
  }
  getGridOptions() {
    return { columns: 24, rows: 10, min_columns: 6, min_rows: 6 };
  }
  static getConfigElement() {
    return document.createElement('heatingplan-card-editor');
  }
  static getStubConfig() {
    return { type: 'custom:heatingplan-card', title: 'Heizplan' };
  }
  connectedCallback() {
    this.render();
    if (this.currentHass) {
      this.subscribe();
      void this.refresh();
    }
    this.timer = setInterval(() => {
      void this.refreshCalendar();
      if (!this.edit && !this.quick && !this.deletion) this.requestRender();
      if (!this.unsubscribe && this.currentHass && !this.busy) void this.refresh();
    }, 60000);
  }
  disconnectedCallback() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.subscribedConnection = undefined;
    this.refreshId++;
    this.calendarRequest++;
    this.calendarKey = '';
    if (this.timer) clearInterval(this.timer);
  }
  private requestRender() {
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      if (this.isConnected) this.render();
    });
  }
  private subscribe() {
    const connection = this.currentHass?.connection;
    if (!connection || this.subscribing || connection === this.subscribedConnection) return;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.subscribedConnection = connection;
    this.subscribing = true;
    connection
      .subscribeMessage(
        () => {
          if (!this.busy) void this.refresh();
        },
        { type: 'scheduler_updated' },
      )
      .then((unsub) => {
        if (this.isConnected && this.currentHass?.connection === connection) this.unsubscribe = unsub;
        else unsub();
      })
      .catch(() => {
        this.subscribedConnection = undefined;
      })
      .finally(() => {
        this.subscribing = false;
      });
  }
  private async refresh() {
    const request = ++this.refreshId;
    try {
      const schedules = await this.api.list();
      if (request !== this.refreshId || !this.isConnected) return;
      this.schedules = schedules;
      void this.refreshCalendar();
      this.loaded = true;
      this.error = '';
    } catch (error) {
      if (request !== this.refreshId) return;
      this.error = this.errorText(error);
    }
    if (!this.edit && !this.quick && !this.deletion) this.requestRender();
  }
  private async refreshCalendar(force = false) {
    if (!this.currentHass || !this.isConnected || !this.schedules.some(usesWorkday)) return;
    const dates = this.overview ? upcomingDates(this.hass) : weekDates(this.hass, this.weekOffset);
    const key = calendarKey(this.hass, dates);
    if (!force && key === this.calendarKey && Date.now() < this.calendarExpires) return;
    const request = ++this.calendarRequest;
    this.calendarKey = key;
    this.calendarExpires = Date.now() + 300000;
    this.calendar = {};
    if (!this.edit && !this.quick && !this.deletion) this.requestRender();
    const result = await loadCalendarWeek(this.hass, dates);
    if (request !== this.calendarRequest || !this.isConnected) return;
    this.calendar = result;
    if (!this.edit && !this.quick && !this.deletion) this.requestRender();
  }
  private errorText(error: unknown) {
    return error instanceof Error
      ? error.message
      : 'Die Verbindung ist unterbrochen. Bitte versuche es erneut.';
  }
  private rooms() {
    return this.currentHass ? roomList(this.currentHass, this.config.entities) : [];
  }
  private selected(): Room | undefined {
    const rooms = this.rooms();
    return rooms.find((r) => r.id === this.room) || rooms[0];
  }
  private unit() {
    return this.currentHass?.config?.unit_system?.temperature || '°C';
  }
  private render() {
    const oldScroll = this.root.querySelector('.dialog-body')?.scrollTop || 0;
    const oldFocus = this.root.activeElement?.getAttribute('aria-label');
    const oldModal = this.root.querySelector<HTMLDialogElement>('dialog');
    const rooms = this.rooms(),
      room = this.selected();
    if (room) this.room = room.id;
    const title = this.config.title || 'Heizplan';
    const markup = `<style>${styles}</style><section class="app" ${this.edit || this.quick || this.deletion ? 'inert' : ''} aria-label="${escape(title)}">
      <header class="top"><div><h1>${escape(title)}</h1></div><div class="top-tools"><button class="btn ${this.overview ? 'primary' : ''}" data-action="overview" aria-label="Gesamtübersicht" title="Gesamtübersicht" aria-pressed="${this.overview}" ${!this.loaded || !room || this.busy ? 'disabled' : ''}>${icon('overview')}</button><button class="btn" data-action="refresh" aria-label="Heizpläne neu laden" ${this.busy ? 'disabled' : ''}>${icon('refresh')}</button><button class="btn primary" data-action="new" aria-label="Neuer Plan" ${!room || !this.loaded || this.busy || this.error ? 'disabled' : ''}>${icon('plus')}<span class="text">Neuer Plan</span></button></div></header>
      ${this.error ? `<div role="alert" class="status error"><span>${escape(this.error)}</span><button class="btn small" data-action="refresh">Erneut versuchen</button></div>` : ''}
      ${this.message ? `<div role="status" class="status"><span>${icon('check')} ${escape(this.message)}</span>${this.undo ? '<button class="btn small" data-action="undo">Rückgängig</button>' : ''}<button class="btn small" aria-label="Meldung schließen" data-action="dismiss">${icon('close')}</button></div>` : ''}
      ${!this.currentHass || (!this.loaded && !this.error) ? '<div class="loading" role="status">Heizpläne werden geladen …<div class="skeleton"></div><div class="skeleton"></div></div>' : !room ? `<div class="empty-state">${icon('home')}<h2>Noch keine Thermostate</h2><p>Wähle in der Kartenkonfiguration die Thermostate aus, die du hier steuern möchtest.</p></div>` : this.overview ? this.overviewHtml() : `<div class="layout"><nav class="rooms" aria-label="Räume"><p class="section-label">Meine Räume · ${rooms.length}</p>${rooms.map((r) => this.roomHtml(r)).join('')}</nav><main class="main"><label class="field room-select">Raum<select id="room-select" aria-label="Raum auswählen">${rooms.map((r) => `<option value="${escape(r.id)}" ${r.id === room.id ? 'selected' : ''}>${escape(r.name)}${rooms.filter((other) => other.name === r.name).length > 1 ? ` · ${escape(r.detail)}` : ''}</option>`).join('')}</select></label>${this.roomContent(room)}</main></div>`}
    </section>${this.edit ? this.editorHtml(this.edit) : this.quick ? this.quickHtml() : this.deletion ? this.deleteHtml() : ''}`;
    // hass updates often concern unrelated entities. Leave an unchanged card
    // in place so the browser can retain its scroll anchors and focus.
    if (markup === this.renderedMarkup) return;
    const scrollPositions: { element: HTMLElement; top: number; left: number }[] = [];
    let ancestor: HTMLElement | null = this;
    while (ancestor) {
      scrollPositions.push({ element: ancestor, top: ancestor.scrollTop, left: ancestor.scrollLeft });
      const tree: Node = ancestor.getRootNode();
      ancestor = ancestor.parentElement || (tree instanceof ShadowRoot ? (tree.host as HTMLElement) : null);
    }
    oldModal?.close();
    this.root.innerHTML = markup;
    this.renderedMarkup = markup;
    const modal = this.root.querySelector<HTMLDialogElement>('dialog');
    if (modal) {
      modal.addEventListener('cancel', (event) => {
        event.preventDefault();
        this.close();
      });
      modal.showModal();
      const body = this.root.querySelector('.dialog-body');
      if (body) body.scrollTop = oldScroll;
      if (oldFocus)
        [...modal.querySelectorAll<HTMLElement>('[aria-label]')]
          .find((el) => el.getAttribute('aria-label') === oldFocus)
          ?.focus({ preventScroll: true });
    }
    // HA's card-preview scroller can live above multiple shadow roots. Restore
    // those containers after real content changes as well as form updates.
    for (const { element, top, left } of scrollPositions) {
      if (element.scrollTop !== top) element.scrollTop = top;
      if (element.scrollLeft !== left) element.scrollLeft = left;
    }
  }
  private overviewHtml() {
    const now = new Date(),
      today = localDate(this.hass, now),
      dates = upcomingDates(this.hass, now);
    const rows = roomOverview(this.rooms(), this.schedules, this.hass, this.calendar, now);
    const labels = {
      none: 'Kein Heizplan',
      paused: 'Alle Pläne pausiert',
      unknown: 'Nächste Schaltung noch unklar',
      conflict: 'Mehrere aktive Pläne · bitte prüfen',
      later: 'Keine Schaltung in den nächsten 7 Tagen',
      next: '',
    };
    return `<main class="overview" aria-label="Gesamtübersicht aller Räume"><div class="between overview-head"><div><p class="eyebrow">Alle Räume</p><h2>Als Nächstes</h2><p class="muted">Die nächste geplante Schaltung pro Raum, nach Uhrzeit sortiert.</p></div><button class="btn small" data-action="overview">Zur Raumansicht</button></div><div class="overview-list">${rows
      .map((row) => {
        const event = row.next;
        const when = event
          ? `${event.date === today ? 'Heute' : event.date === dates[1] ? 'Morgen' : shortDate(event.date)} · ${clock(event.minute)} Uhr`
          : '';
        return `<button class="overview-room ${row.status === 'paused' ? 'paused' : ''}" data-action="overview-room" data-id="${escape(row.room.id)}" aria-label="${escape(row.room.name)}: Heizpläne ansehen"><span class="overview-room-name"><strong>${escape(row.room.name)}</strong><small>${escape(row.room.detail)} · ${row.unavailable ? 'Nicht erreichbar' : `Jetzt ${row.room.state.state === 'off' ? 'Aus' : `${temperature(row.room.state.attributes.temperature)} ${escape(this.unit())}`}`}</small></span><span class="overview-event">${event ? `<span class="overview-time">${when}</span><strong>${row.status === 'conflict' ? 'Pläne prüfen' : escape(temperatureText(event.slot, this.unit()))}</strong>` : `<strong>${labels[row.status]}</strong>`}<small>${row.status === 'next' && event ? escape(event.plan.name || 'Heizplan') : row.status === 'unknown' ? 'Kalender, Sonderregeln oder Planstatus prüfen' : row.status === 'conflict' ? labels.conflict : ''}${row.paused && row.status !== 'paused' ? ` · ${row.paused} pausiert` : ''}</small></span>${icon('arrow')}</button>`;
      })
      .join(
        '',
      )}</div><p class="footnote">Tippe auf einen Raum, um seine Heizpläne zu öffnen. Die Vorschau berücksichtigt heute und die nächsten sieben Tage. Andere Steuerungen können die tatsächliche Einstellung ändern.</p>${this.recurringHtml(this.schedules, true)}</main>`;
  }
  private recurringHtml(plans: Schedule[], showRooms = false) {
    const rooms = this.rooms();
    const recurring = plans.filter(
      (plan) =>
        (!plan.repeat_type || plan.repeat_type === 'repeat') &&
        targets(plan).some((id) => rooms.some((room) => room.id === id)),
    );
    return `<section class="recurring" aria-label="Wiederkehrende Pläne"><h3>Wiederkehrende Pläne</h3><p class="muted">Diese Pläne werden an den angegebenen Tagen wiederholt ausgeführt.</p>${
      recurring.length
        ? `<div class="recurring-list">${recurring
            .map((plan) => {
              const roomNames = rooms
                .filter((room) => targets(plan).includes(room.id))
                .map((room) => room.name)
                .join(', ');
              const unknown = ['unknown', 'unavailable'].includes(this.hass.states[plan.entity_id]?.state);
              const enabled = isEnabled(plan, this.hass);
              const days = dayLabel(plan.weekdays) || 'Besondere Tagesregeln';
              return `<article class="recurring-plan ${!enabled && !unknown ? 'paused' : ''}"><div class="recurring-copy"><strong>${escape(plan.name || 'Heizplan')}</strong><small>${showRooms ? `${escape(roomNames)} · ` : ''}${escape(days)}</small>${plan.start_date || plan.end_date ? `<small>Zeitraum: ${escape(plan.start_date || 'offen')} bis ${escape(plan.end_date || 'offen')}</small>` : ''}</div><span class="pill ${unknown ? 'warn' : ''}">${unknown ? 'Status unklar' : enabled ? 'Aktiv' : 'Pausiert'}</span>${!editProblem(plan) ? `<button class="btn small" data-action="edit" data-id="${escape(plan.schedule_id)}" aria-label="Wiederkehrenden Plan ${escape(plan.name || 'Heizplan')} bearbeiten">${icon('edit')} Bearbeiten</button>` : '<small>Sonderregeln</small>'}</article>`;
            })
            .join('')}</div>`
        : '<p class="recurring-empty muted">Keine wiederkehrenden Pläne vorhanden.</p>'
    }</section>`;
  }
  private roomHtml(room: Room) {
    return `<button class="room ${room.id === this.room ? 'active' : ''}" data-action="room" data-id="${escape(room.id)}" aria-current="${room.id === this.room ? 'true' : 'false'}"><span class="room-icon">${icon(room.state.state !== 'off' && room.state.attributes.hvac_action === 'heating' ? 'heat' : 'home')}</span><span class="room-copy"><strong>${escape(room.name)}</strong><small>${room.state.state !== 'off' && room.state.attributes.hvac_action === 'heating' ? '<span class="dot"></span>Heizt gerade' : escape(room.detail)}</small></span><span class="room-temp">${temperature(room.state.attributes.current_temperature)}°</span></button>`;
  }
  private roomContent(room: Room) {
    const all = this.schedules.filter((s) => targets(s).includes(room.id));
    const dates = weekDates(this.hass, this.weekOffset);
    const date = dates[this.day];
    const week = calendarWeek(dates[0]);
    const weekLabel =
      this.weekOffset === 0
        ? 'Diese Woche'
        : this.weekOffset === 1
          ? 'Nächste Woche'
          : this.weekOffset === -1
            ? 'Vorherige Woche'
            : 'Ausgewählte Woche';
    const visible = all.filter((s) => scheduleDay(s, date, this.calendar) !== 'no');
    const active = all.filter((s) => isEnabled(s, this.hass));
    const next = active.some(usesWorkday) ? null : nextChange(this.schedules, this.hass, room.id);
    const overlap =
      all.filter((s) => scheduleDay(s, date, this.calendar) === 'yes' && isEnabled(s, this.hass)).length > 1;
    const unavailable = ['unavailable', 'unknown'].includes(room.state.state);
    return `<section class="hero"><div class="hero-title"><div class="row" style="margin-bottom:5px"><p class="eyebrow">Raumübersicht</p></div><h2>${escape(room.name)}</h2><small>${escape(room.detail)}</small><div class="readings"><div class="reading"><small>Raumtemperatur</small><strong>${temperature(room.state.attributes.current_temperature)} <span>${escape(this.unit())}</span></strong></div><div class="reading"><small>Aktuell eingestellt</small><strong>${room.state.state === 'off' ? 'Aus' : `${temperature(room.state.attributes.temperature)} <span>${escape(this.unit())}</span>`}</strong></div></div></div><div style="text-align:right"><span class="pill ${unavailable ? 'warn' : ''}">${unavailable ? 'Nicht erreichbar' : room.state.state !== 'off' && room.state.attributes.hvac_action === 'heating' ? `${icon('heat')} Heizt gerade` : room.state.state === 'off' ? 'Heizung aus' : active.length ? 'Heizplan aktiv' : 'Kein aktiver Plan'}</span><br><button class="btn small" style="margin-top:14px" data-action="quick" ${unavailable || this.busy ? 'disabled' : ''}>Heizung steuern</button></div></section>
    <div class="next">${icon('clock')}<span>${overlap ? 'Mehrere Pläne sind gleichzeitig aktiv. Bitte prüfe die Heizzeiten.' : next ? `Nächster Heizabschnitt <strong>${next.minutes < 1440 ? `in ${Math.floor(next.minutes / 60) ? `${Math.floor(next.minutes / 60)} Std. ` : ''}${next.minutes % 60} Min.` : `in ${Math.floor(next.minutes / 1440)} Tagen`}</strong> · ${next.off ? 'Heizung aus' : `${temperature(next.temperature)} ${escape(this.unit())}`}` : active.length ? 'Die nächste Schaltung wird vom aktiven Heizplan bestimmt.' : 'Ohne aktiven Heizplan bleibt die eingestellte Temperatur bestehen.'}</span></div>
    <div class="between week-head"><div><p class="eyebrow">${weekLabel} · KW ${week.week} · ${week.year}</p><p class="week-range">${shortDate(dates[0])}${dates[0].slice(0, 4)} – ${shortDate(dates[6])}${dates[6].slice(0, 4)}</p><h3>${DAY_NAMES[this.day]}, ${shortDate(date)}</h3></div><div class="week-navigation"><button class="btn quiet small" data-action="previous-week" aria-label="Vorherige Woche">‹</button><button class="btn small today-button" data-action="today">Heute</button><button class="btn quiet small" data-action="next-week" aria-label="Nächste Woche">›</button></div></div><div class="day-tabs" role="group" aria-label="Wochentag">${DAYS.map((_, i) => `<button class="day-tab ${i === this.day ? 'active' : ''}" data-action="day" data-index="${i}" aria-pressed="${i === this.day}">${SHORT_DAYS[i]}<small>${shortDate(dates[i])}</small>${dates[i] === localDate(this.hass) ? '<span class="today"></span>' : ''}</button>`).join('')}</div>
    <div class="week-grid" aria-label="Wochenübersicht">${dates.map((date, i) => this.weekColumn(all, date, i)).join('')}</div>
    ${visible.length ? visible.map((plan) => this.planHtml(plan, scheduleDay(plan, date, this.calendar))).join('') : `<div class="empty-state">${icon('sun')}<h3>Kein Heizplan vorhanden</h3><p>Für ${DAY_NAMES[this.day]}, ${shortDate(date)} ist kein Heizplan zugeordnet.</p><button class="btn primary" data-action="new-day">${icon('plus')} Heizzeiten festlegen</button></div>`}
    ${this.recurringHtml(all)}
    <p class="footnote">Ein pausierter Plan schaltet die Heizung nicht aus. Deine Zeitpläne laufen in Home Assistant weiter, auch wenn du diese Ansicht schließt.</p>`;
  }
  private weekColumn(plans: Schedule[], date: string, day: number) {
    const visible = plans.filter((s) => scheduleDay(s, date, this.calendar) !== 'no');
    return `<div class="week-column ${date === localDate(this.hass) ? 'today-col' : ''}"><small>${SHORT_DAYS[day]} · ${shortDate(date)}</small>${
      visible.length
        ? visible
            .map((plan) => {
              const match = scheduleDay(plan, date, this.calendar),
                enabled = isEnabled(plan, this.hass);
              return `<div class="week-plan ${enabled ? '' : 'paused'} ${match === 'unknown' ? 'uncertain' : ''}"><div class="week-plan-label"><strong>${escape(plan.name || 'Heizplan')}</strong><span>${enabled ? 'Aktiv' : 'Pausiert'}</span>${this.calendarNote(plan, match, date)}</div>${editProblem(plan) ? '<div class="segment empty">Sonderregeln</div>' : plan.timeslots.map((slot) => `<div class="segment ${Number(slot.actions[0].service_data?.temperature) >= 20 ? 'warm' : ''}"><span>${escape(slot.start.slice(0, 5))}</span><strong>${slotIsOff(slot) ? 'Aus' : `${temperature(slot.actions[0].service_data?.temperature)}°`}</strong></div>`).join('')}</div>`;
            })
            .join('')
        : '<div class="segment empty">Kein Heizplan</div>'
    }</div>`;
  }
  private calendarNote(plan: Schedule, match: DayMatch, date: string) {
    if (match === 'unknown') return '<span class="calendar-note">Zuordnung noch offen</span>';
    if (usesWorkday(plan))
      return `<span class="calendar-note">${this.calendar[date]?.source === 'standard' ? 'Standardwoche' : 'Arbeitskalender'}</span>`;
    return '';
  }
  private planHtml(plan: Schedule, match: DayMatch = 'yes') {
    const problem = editProblem(plan),
      enabled = isEnabled(plan, this.hass),
      now = currentClock(this.hass);
    return `<article class="plan ${enabled ? '' : 'paused'} ${match === 'unknown' ? 'uncertain' : ''}"><div class="plan-head"><div><h3>${escape(plan.name || 'Heizplan')}</h3><small>${escape(dayLabel(plan.weekdays))}</small>${this.calendarNote(plan, match, weekDates(this.hass, this.weekOffset)[this.day])}</div><span class="pill ${match === 'unknown' ? 'warn' : ''}">${enabled ? 'Aktiv' : 'Pausiert'}</span></div><div class="plan-body">${
      problem
        ? `<div class="notice" style="margin:14px">${icon('lock')} ${escape(problem)} Die Einstellungen bleiben erhalten. Bearbeite diesen Plan in deiner bisherigen Scheduler-Oberfläche.</div>`
        : plan.timeslots
            .map((slot) => {
              const current =
                enabled &&
                weekDates(this.hass, this.weekOffset)[this.day] === localDate(this.hass) &&
                match === 'yes' &&
                minutes(slot.start) <= now.minute &&
                endMinutes(slot.stop!) > now.minute;
              return `<div class="period ${current ? 'active-period' : ''}">${icon(Number(slot.actions[0].service_data?.temperature) >= 20 ? 'sun' : 'moon')}<div><strong>${escape(slot.start.slice(0, 5))} – ${clock(endMinutes(slot.stop!))}</strong>${current ? '<small>Jetzt im Heizplan</small>' : ''}</div><div class="period-temp">${escape(temperatureText(slot, this.unit()))}</div></div>`;
            })
            .join('')
    }</div><footer class="plan-footer"><button class="toggle" role="switch" aria-checked="${enabled}" aria-label="Heizplan ${escape(plan.name || 'Heizplan')} aktiv" data-action="toggle" data-id="${escape(plan.schedule_id)}" ${this.busy ? 'disabled' : ''}><span class="switch"></span>${enabled ? 'Plan aktiv' : 'Plan pausiert'}</button><div class="plan-actions"><button class="btn quiet small" data-action="delete" data-id="${escape(plan.schedule_id)}" aria-label="Heizplan ${escape(plan.name || 'Heizplan')} löschen" ${this.busy ? 'disabled' : ''}>${icon('bin')}</button>${!problem ? `<button class="btn quiet small" data-action="copy" data-id="${escape(plan.schedule_id)}" ${this.busy ? 'disabled' : ''}>${icon('copy')} Kopieren</button><button class="btn small" data-action="edit" data-id="${escape(plan.schedule_id)}" ${this.busy ? 'disabled' : ''}>${icon('edit')} Bearbeiten</button>` : ''}</div></footer></article>`;
  }
  private editorHtml(session: EditSession) {
    const draft = session.draft,
      range = limits(this.hass, draft.entity);
    return `<dialog class="sheet" role="dialog" aria-modal="true" aria-labelledby="edit-title"><section class="dialog"><header class="dialog-head"><div><p class="eyebrow">Heizzeiten gestalten</p><h2 id="edit-title">${session.original ? 'Heizplan bearbeiten' : 'Neuer Heizplan'}</h2></div><button class="btn quiet" data-action="close" aria-label="Editor schließen" ${this.busy ? 'disabled' : ''}>${icon('close')}</button></header><div class="dialog-body" ${this.busy ? 'inert' : ''}><div class="two-fields"><label class="field">Name des Plans<input class="input" data-field="name" value="${escape(draft.name)}" maxlength="80" autocomplete="off"></label><label class="field">Thermostat<select data-field="entity" ${session.original ? 'disabled' : ''}>${this.rooms()
      .map(
        (r) =>
          `<option value="${escape(r.id)}" ${r.id === draft.entity ? 'selected' : ''}>${escape(r.name)} · ${escape(r.detail)}</option>`,
      )
      .join(
        '',
      )}</select></label></div><h3>Für welche Tage?</h3><label class="field" style="margin-top:10px">Tagesauswahl<select data-field="calendar"><option value="days" ${!draft.weekdays.some((day) => ['workday', 'weekend'].includes(day)) ? 'selected' : ''}>Wochentage selbst wählen</option><option value="workday" ${draft.weekdays.includes('workday') ? 'selected' : ''}>Arbeitstage nach Arbeitskalender</option><option value="weekend" ${draft.weekdays.includes('weekend') ? 'selected' : ''}>Freie Tage nach Arbeitskalender</option></select></label>${draft.weekdays.some((day) => ['workday', 'weekend'].includes(day)) ? '<p class="helper">Feiertage und freie Tage bestimmt dein Arbeitskalender in Home Assistant.</p>' : ''}<div class="day-choice">${DAYS.map((day, i) => `<label><input type="checkbox" data-day="${day}" ${draft.weekdays.includes(day) ? 'checked' : ''} ${draft.weekdays.some((d) => ['workday', 'weekend'].includes(d)) ? 'disabled' : ''}><span>${SHORT_DAYS[i]}</span></label>`).join('')}</div><div class="presets"><button class="preset" data-action="preset" data-preset="work">Mo–Fr</button><button class="preset" data-action="preset" data-preset="weekend">Sa–So</button><button class="preset" data-action="preset" data-preset="all">Jeden Tag</button></div><div class="between"><h3>Wie warm soll es sein?</h3><small>${draft.periods.length} Abschnitte</small></div><p class="helper">Jede Einstellung gilt ab der angegebenen Uhrzeit bis zum nächsten Abschnitt.</p>${draft.periods.map((period, i) => this.periodHtml(period, i, draft)).join('')}<button class="btn quiet" style="margin-top:12px" data-action="add-period" ${draft.periods.length >= 24 ? 'disabled' : ''}>${icon('plus')} Abschnitt hinzufügen</button><div class="notice">${session.original ? 'Änderungen an einem aktiven Plan können sofort die Temperatur anpassen.' : 'Mit dem Speichern wird dieser Plan aktiviert. Die passende Einstellung wird sofort angewendet.'} Die letzte Einstellung gilt bis 24:00 Uhr.</div><div class="inline-error" role="alert" id="edit-error">${escape(session.error)}</div></div><footer class="dialog-footer">${session.discard ? '<span>Änderungen verwerfen?</span><div class="actions"><button class="btn" data-action="keep">Weiter bearbeiten</button><button class="btn primary" data-action="discard">Verwerfen</button></div>' : `<div class="actions"><button class="btn" data-action="close" ${this.busy ? 'disabled' : ''}>Abbrechen</button><button class="btn primary" data-action="save" ${this.busy ? 'disabled' : ''}>${this.busy ? 'Wird gespeichert …' : 'Heizplan speichern'}</button></div>`}</footer></section></dialog>`;
  }
  private periodHtml(period: Period, i: number, draft: Draft) {
    const range = limits(this.hass, draft.entity);
    const off = period.mode === 'off';
    const canOff =
      supportsMode(this.hass, draft.entity, 'off') && supportsMode(this.hass, draft.entity, 'heat');
    return `<div class="edit-period"><label class="period-time">Ab Uhrzeit<input type="time" value="${clock(period.start)}" step="60" data-start="${i}" aria-label="Beginn Abschnitt ${i + 1}" ${i === 0 ? 'disabled' : ''}></label><div class="period-settings"><label class="period-mode">Einstellung<select data-period-mode="${i}" aria-label="Betrieb Abschnitt ${i + 1}"><option value="heat" ${off ? '' : 'selected'}>Heizen</option><option value="off" ${off ? 'selected' : ''} ${canOff ? '' : 'disabled'}>Heizung aus${canOff ? '' : ' (nicht unterstützt)'}</option></select></label>${off ? '<p class="off-period">Heizung ausgeschaltet</p>' : `<div class="temperature-control"><p class="stepper-label">Temperatur · ${escape(this.unit())}</p><div class="stepper"><button data-action="step" data-index="${i}" data-delta="-1" aria-label="Abschnitt ${i + 1} kälter">−</button><input type="number" value="${period.temperature}" min="${range.min}" max="${range.max}" step="${range.step}" data-temperature="${i}" aria-label="Temperatur Abschnitt ${i + 1}"><button data-action="step" data-index="${i}" data-delta="1" aria-label="Abschnitt ${i + 1} wärmer">+</button></div></div>`}<\/div><button class="delete" data-action="remove-period" data-index="${i}" aria-label="Abschnitt ${i + 1} entfernen" ${i === 0 ? 'disabled' : ''}>${icon('bin')}</button></div>`;
  }
  private deleteHtml() {
    return `<dialog class="sheet" role="dialog" aria-modal="true" aria-labelledby="delete-title"><section class="dialog" style="max-width:460px;height:auto"><header class="dialog-head"><h2 id="delete-title">Heizplan löschen?</h2></header><div class="dialog-body"><p><strong>${escape(this.deletion!.schedule.name || 'Heizplan')}</strong> wird dauerhaft gelöscht. Die aktuell eingestellte Raumtemperatur bleibt bestehen.</p><p class="helper">Du kannst den Plan stattdessen pausieren, wenn du ihn später wieder verwenden möchtest.</p><div role="alert" class="inline-error">${escape(this.deletion!.error)}</div></div><footer class="dialog-footer"><button class="btn" data-action="close" ${this.busy ? 'disabled' : ''}>Behalten</button><button class="btn primary" data-action="confirm-delete" ${this.busy ? 'disabled' : ''}>${this.busy ? 'Wird gelöscht …' : 'Endgültig löschen'}</button></footer></section></dialog>`;
  }
  private quickHtml() {
    const room = this.selected()!,
      range = limits(this.hass, room.id);
    const off = this.quick!.mode === 'off';
    const hasPlan = this.schedules.some((s) => targets(s).includes(room.id) && isEnabled(s, this.hass));
    return `<dialog class="sheet" role="dialog" aria-modal="true" aria-labelledby="quick-title"><section class="dialog quick-dialog"><header class="dialog-head"><div><p class="eyebrow">${escape(room.name)}</p><h2 id="quick-title">Heizung steuern</h2></div><button class="btn quiet" data-action="close" aria-label="Schließen" ${this.busy ? 'disabled' : ''}>${icon('close')}</button></header><div class="dialog-body" ${this.busy ? 'inert' : ''}><div class="mode-buttons" role="group" aria-label="Heizungsbetrieb"><button class="btn ${off ? '' : 'primary'}" data-action="quick-mode" data-mode="heat" aria-pressed="${!off}" ${room.state.state === 'off' && !supportsMode(this.hass, room.id, 'heat') ? 'disabled' : ''}>Heizen</button><button class="btn ${off ? 'primary' : ''}" data-action="quick-mode" data-mode="off" aria-pressed="${off}" ${supportsMode(this.hass, room.id, 'off') ? '' : 'disabled'}>Heizung aus</button></div>${off ? '<p class="off-period">Die Heizung wird ausgeschaltet.</p>' : `<div class="stepper quick-stepper"><button data-action="quick-step" data-delta="-1" aria-label="Kälter">−</button><input type="number" data-field="quick" value="${this.quick!.value}" min="${range.min}" max="${range.max}" step="${range.step}" aria-label="Zieltemperatur"><button data-action="quick-step" data-delta="1" aria-label="Wärmer">+</button></div>`}<p class="helper">${hasPlan ? 'Ein aktiver Heizplan kann die Heizung später wieder einschalten oder die Temperatur ändern.' : 'Die Einstellung bleibt bestehen, bis du sie änderst oder eine andere Steuerung eingreift.'} Der Heizplan wird dabei nicht bearbeitet.</p><div class="inline-error" role="alert">${escape(this.quick!.error)}</div></div><footer class="dialog-footer"><button class="btn" data-action="close" ${this.busy ? 'disabled' : ''}>Abbrechen</button><button class="btn primary" data-action="quick-save" ${this.busy ? 'disabled' : ''}>${this.busy ? 'Wird eingestellt …' : off ? 'Heizung ausschalten' : 'Temperatur einstellen'}</button></footer></section></dialog>`;
  }
  private focusDialog() {
    queueMicrotask(() =>
      this.root
        .querySelector<HTMLElement>('.dialog input:not(:disabled),.dialog button:not(:disabled)')
        ?.focus(),
    );
  }
  private focusTrigger() {
    queueMicrotask(() =>
      this.root.querySelector<HTMLElement>(`[data-action="edit"], [data-action="new"]`)?.focus(),
    );
  }
  private openDraft(draft: Draft, original?: Schedule) {
    this.edit = { draft, original, initial: JSON.stringify(draft), error: '', discard: false };
    this.render();
    this.focusDialog();
  }
  private input(event: Event) {
    const el = event.target as HTMLInputElement;
    if (this.busy) return;
    if (this.quick && el.dataset.field === 'quick') this.quick.value = el.valueAsNumber;
    if (!this.edit) return;
    const d = this.edit.draft;
    if (el.dataset.field === 'name') d.name = el.value;
    if (el.dataset.temperature !== undefined)
      d.periods[Number(el.dataset.temperature)].temperature = el.valueAsNumber;
    if (el.dataset.start !== undefined) d.periods[Number(el.dataset.start)].start = minutes(el.value);
  }
  private change(event: Event) {
    const el = event.target as HTMLInputElement;
    if (this.busy) return;
    if (el.id === 'room-select') {
      this.room = el.value;
      this.render();
      return;
    }
    if (!this.edit) return;
    if (el.dataset.day) {
      const days = this.edit.draft.weekdays;
      this.edit.draft.weekdays = DAYS.filter((day) =>
        day === el.dataset.day ? el.checked : days.includes(day),
      );
    }
    if (el.dataset.periodMode !== undefined) {
      const period = this.edit.draft.periods[Number(el.dataset.periodMode)];
      period.mode = el.value === 'off' ? 'off' : 'heat';
      this.render();
    }
    if (el.dataset.field === 'calendar') {
      this.edit.draft.weekdays = el.value === 'days' ? DAYS.slice(0, 5) : [el.value];
      this.render();
    }
    if (el.dataset.field === 'entity') {
      this.edit.draft.entity = el.value;
      this.render();
    }
  }
  private key(event: KeyboardEvent) {
    if (!this.edit && !this.quick && !this.deletion) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
    if (event.key === 'Tab') {
      const elements = [
        ...this.root.querySelectorAll<HTMLElement>(
          '.dialog button:not(:disabled),.dialog input:not(:disabled),.dialog select:not(:disabled)',
        ),
      ];
      const first = elements[0],
        last = elements.at(-1);
      if (event.shiftKey && this.root.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && this.root.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }
  private close() {
    if (this.busy) return;
    if (this.edit && JSON.stringify(this.edit.draft) !== this.edit.initial) {
      this.edit.discard = true;
      this.render();
      this.focusDialog();
      return;
    }
    this.edit = undefined;
    this.quick = undefined;
    this.deletion = undefined;
    this.render();
    this.focusTrigger();
  }
  private async handleClick(event: Event) {
    const target = (event.target as Element).closest<HTMLElement>('[data-action]');
    if (!target || target.hasAttribute('disabled') || this.busy) return;
    const action = target.dataset.action,
      id = target.dataset.id,
      index = Number(target.dataset.index);
    if (action === 'overview') {
      this.overview = !this.overview;
      void this.refreshCalendar();
      this.render();
      this.root.querySelector<HTMLElement>('[data-action="overview"]')?.focus({ preventScroll: true });
    } else if (action === 'overview-room') {
      this.room = id!;
      this.overview = false;
      this.weekOffset = 0;
      this.day = currentClock(this.hass).day;
      void this.refreshCalendar();
      this.render();
      this.root.querySelector<HTMLElement>('[data-action="overview"]')?.focus({ preventScroll: true });
    } else if (action === 'room') {
      this.room = id!;
      this.render();
    } else if (action === 'day') {
      this.day = index;
      this.render();
    } else if (action === 'today') {
      this.weekOffset = 0;
      void this.refreshCalendar();
      this.day = currentClock(this.hass).day;
      this.render();
    } else if (action === 'previous-week' || action === 'next-week') {
      this.weekOffset += action === 'next-week' ? 1 : -1;
      void this.refreshCalendar();
      this.render();
    } else if (action === 'refresh') {
      await this.refresh();
      await this.refreshCalendar(true);
    } else if (action === 'dismiss') {
      this.message = '';
      this.render();
    } else if (action === 'new' || action === 'new-day') {
      const room = this.selected();
      if (room) {
        const draft = newDraft(room.id, this.hass);
        draft.name = `${room.name} · ${action === 'new-day' ? DAY_NAMES[this.day] : 'Wohlfühlzeiten'}`;
        if (action === 'new-day') draft.weekdays = [DAYS[this.day]];
        this.openDraft(draft);
      }
    } else if (action === 'edit' || action === 'copy') {
      this.busy = true;
      try {
        const original = await this.api.item(id!);
        const problem = editProblem(original);
        if (problem) throw new Error(problem);
        const draft = toDraft(original);
        if (action === 'copy') {
          draft.name = `${draft.name} · Kopie`.slice(0, 80);
          this.openDraft(draft);
        } else this.openDraft(draft, original);
      } catch (error) {
        this.error = this.errorText(error);
      } finally {
        this.busy = false;
        this.render();
        if (this.edit) this.focusDialog();
      }
    } else if (action === 'close') {
      this.close();
    } else if (action === 'discard') {
      this.edit = undefined;
      this.render();
      this.focusTrigger();
    } else if (action === 'keep' && this.edit) {
      this.edit.discard = false;
      this.render();
      this.focusDialog();
    } else if (action === 'preset' && this.edit) {
      this.edit.draft.weekdays =
        target.dataset.preset === 'work'
          ? DAYS.slice(0, 5)
          : target.dataset.preset === 'weekend'
            ? DAYS.slice(5)
            : [...DAYS];
      this.render();
    } else if (action === 'add-period' && this.edit) {
      this.edit.draft.periods = insertPeriod(this.edit.draft.periods);
      this.render();
    } else if (action === 'remove-period' && this.edit && index > 0) {
      this.edit.draft.periods.splice(index, 1);
      this.render();
    } else if (action === 'step' && this.edit) {
      const range = limits(this.hass, this.edit.draft.entity),
        period = this.edit.draft.periods[index];
      period.temperature = Number(
        Math.max(
          range.min,
          Math.min(
            range.max,
            (Number.isFinite(period.temperature) ? period.temperature : range.min) +
              Number(target.dataset.delta) * range.step,
          ),
        ).toFixed(3),
      );
      this.render();
    } else if (action === 'save' && this.edit) {
      const session = this.edit;
      const problem = validateDraft(session.draft, this.hass);
      if (problem) {
        session.error = problem;
        this.render();
        return;
      }
      this.busy = true;
      this.render();
      try {
        this.schedules = await this.api.save(session.draft, session.original);
        void this.refreshCalendar();
        const saved = this.schedules.find((s) => s.schedule_id === session.original?.schedule_id);
        this.undo =
          session.original && saved
            ? { before: structuredClone(session.original), after: structuredClone(saved) }
            : undefined;
        this.message = 'Dein Heizplan wurde gespeichert.';
        this.error = '';
        this.edit = undefined;
        if (
          !session.draft.weekdays.includes(DAYS[this.day]) &&
          !session.draft.weekdays.some((day) => ['workday', 'weekend'].includes(day))
        )
          this.day = Math.max(0, DAYS.indexOf(session.draft.weekdays[0]));
        this.room = session.draft.entity;
      } catch (error) {
        session.error = this.errorText(error);
      } finally {
        this.busy = false;
        this.render();
        if (!this.edit) this.focusTrigger();
      }
    } else if (action === 'toggle') {
      const schedule = this.schedules.find((s) => s.schedule_id === id);
      if (!schedule) return;
      this.busy = true;
      this.render();
      try {
        await this.api.toggle(schedule, !isEnabled(schedule, this.hass));
        this.message = isEnabled(schedule, this.hass)
          ? 'Heizplan wird pausiert. Die Heizung bleibt auf ihrer bisherigen Einstellung.'
          : 'Heizplan wird aktiviert.';
        this.undo = undefined;
        await this.refresh();
      } catch (error) {
        this.error = this.errorText(error);
      } finally {
        this.busy = false;
        this.render();
      }
    } else if (action === 'undo' && this.undo) {
      this.busy = true;
      this.render();
      try {
        this.schedules = await this.api.save(toDraft(this.undo.before), this.undo.after);
        void this.refreshCalendar();
        this.message = 'Die letzte Änderung wurde rückgängig gemacht.';
        this.undo = undefined;
      } catch (error) {
        this.error = this.errorText(error);
      } finally {
        this.busy = false;
        this.render();
      }
    } else if (action === 'delete') {
      const schedule = this.schedules.find((s) => s.schedule_id === id);
      if (schedule) {
        this.deletion = { schedule: structuredClone(schedule), error: '' };
        this.render();
        this.focusDialog();
      }
    } else if (action === 'confirm-delete' && this.deletion) {
      this.busy = true;
      this.render();
      try {
        this.schedules = await this.api.remove(this.deletion.schedule);
        this.deletion = undefined;
        this.undo = undefined;
        this.message = 'Der Heizplan wurde gelöscht.';
      } catch (error) {
        this.deletion!.error = this.errorText(error);
      } finally {
        this.busy = false;
        this.render();
        if (!this.deletion) this.focusTrigger();
      }
    } else if (action === 'quick') {
      const room = this.selected()!;
      this.quick = {
        value: Number(room.state.attributes.temperature) || 20,
        mode: room.state.state === 'off' ? 'off' : 'heat',
        error: '',
      };
      this.render();
      this.focusDialog();
    } else if (action === 'quick-mode' && this.quick) {
      this.quick.mode = target.dataset.mode === 'off' ? 'off' : 'heat';
      this.render();
    } else if (action === 'quick-step' && this.quick) {
      const range = limits(this.hass, this.room);
      this.quick.value = Number(
        Math.max(
          range.min,
          Math.min(range.max, (this.quick.value || range.min) + Number(target.dataset.delta) * range.step),
        ).toFixed(3),
      );
      this.render();
    } else if (action === 'quick-save' && this.quick) {
      const range = limits(this.hass, this.room),
        value = this.quick.value;
      if (
        this.quick.mode === 'heat' &&
        (!Number.isFinite(value) ||
          value < range.min ||
          value > range.max ||
          Math.abs(value / range.step - Math.round(value / range.step)) > 0.00001)
      ) {
        this.quick.error = `Bitte wähle ${temperature(range.min)} bis ${temperature(range.max)} ${this.unit()} in Schritten von ${temperature(range.step)}.`;
        this.render();
        return;
      }
      this.busy = true;
      this.render();
      try {
        if (this.quick.mode === 'off') {
          if (!supportsMode(this.hass, this.room, 'off'))
            throw new Error('Dieses Thermostat unterstützt den Aus-Modus nicht.');
          await this.hass.callService('climate', 'set_hvac_mode', { entity_id: this.room, hvac_mode: 'off' });
          this.message = 'Der Ausschaltbefehl wurde an das Thermostat gesendet.';
        } else {
          if (this.hass.states[this.room]?.state === 'off' && !supportsMode(this.hass, this.room, 'heat'))
            throw new Error('Dieses Thermostat unterstützt keinen direkten Heizmodus.');
          await this.hass.callService('climate', 'set_temperature', {
            entity_id: this.room,
            temperature: value,
            ...(supportsMode(this.hass, this.room, 'heat') ? { hvac_mode: 'heat' } : {}),
          });
          this.message = 'Die gewünschte Temperatur wurde an das Thermostat gesendet.';
        }
        this.quick = undefined;
      } catch (error) {
        this.quick!.error = this.errorText(error);
      } finally {
        this.busy = false;
        this.render();
      }
    }
  }
}
class HeatingPlanEditor extends HTMLElement {
  private root = this.attachShadow({ mode: 'open' });
  private config: CardConfig = { type: 'custom:heatingplan-card' };
  private state?: Hass;
  private roomSignature = '';

  constructor() {
    super();
    this.root.addEventListener('change', (event) => this.handleChange(event));
  }

  setConfig(config: CardConfig) {
    const titleChanged = config.title !== this.config.title;
    this.config = { ...config, ...(config.entities ? { entities: [...config.entities] } : {}) };
    this.update(titleChanged);
  }

  set hass(hass: Hass) {
    this.state = hass;
    this.update();
  }

  connectedCallback() {
    this.update(true);
  }

  private update(syncTitle = false) {
    // Keep the scroll container and form inputs alive across frequent hass
    // updates and configuration echoes from Home Assistant.
    if (!this.root.querySelector('section')) {
      this.root.innerHTML = `<style>:host{display:block;font:inherit}label{display:block;margin:12px 0}input[type=text]{display:block;width:100%;box-sizing:border-box;padding:12px;border:1px solid var(--divider-color,#ccc);border-radius:8px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#222)}.rooms{max-height:300px;overflow:auto}p{color:var(--secondary-text-color,#666);font-size:13px}input[type=checkbox]{margin-right:10px}</style><section><label>Titel<input type="text" id="title"></label><label><input type="checkbox" id="all">Alle Thermostate anzeigen</label><div class="rooms"></div><p>Wähle vorzugsweise die Better-Thermostat-Entitäten aus, damit jeder Raum nur einmal erscheint. Die Scheduler-Integration muss installiert sein.</p></section>`;
      syncTitle = true;
    }
    if (syncTitle)
      this.root.querySelector<HTMLInputElement>('#title')!.value = this.config.title || 'Heizplan';

    const rooms = this.state ? roomList(this.state) : [];
    const signature = JSON.stringify(rooms.map((room) => [room.id, room.name, room.detail]));
    const list = this.root.querySelector<HTMLElement>('.rooms')!;
    if (signature !== this.roomSignature) {
      const scrollTop = list.scrollTop;
      const focusedId = (this.root.activeElement as HTMLElement | null)?.dataset.id;
      const fragment = this.ownerDocument.createDocumentFragment();
      for (const room of rooms) {
        const label = this.ownerDocument.createElement('label');
        const input = this.ownerDocument.createElement('input');
        input.type = 'checkbox';
        input.dataset.id = room.id;
        label.append(input, this.ownerDocument.createTextNode(`${room.name} · ${room.detail}`));
        fragment.append(label);
      }
      list.replaceChildren(fragment);
      this.roomSignature = signature;
      this.syncSelection();
      if (focusedId)
        [...list.querySelectorAll<HTMLInputElement>('input')]
          .find((input) => input.dataset.id === focusedId)
          ?.focus({ preventScroll: true });
      list.scrollTop = scrollTop;
    } else {
      this.syncSelection();
    }
  }

  private syncSelection() {
    const all = this.config.entities === undefined;
    this.root.querySelector<HTMLInputElement>('#all')!.checked = all;
    for (const input of this.root.querySelectorAll<HTMLInputElement>('[data-id]')) {
      input.checked = all || this.config.entities!.includes(input.dataset.id!);
      input.disabled = all;
    }
  }

  private handleChange(event: Event) {
    const el = event.target as HTMLInputElement;
    if (el.id === 'title') this.config.title = el.value;
    else if (el.id === 'all') {
      if (el.checked) delete this.config.entities;
      else this.config.entities = this.state ? roomList(this.state).map((room) => room.id) : [];
    } else if (el.dataset.id) {
      const selected = new Set(this.config.entities || []);
      if (el.checked) selected.add(el.dataset.id);
      else selected.delete(el.dataset.id);
      this.config.entities = [...selected];
    } else return;
    this.syncSelection();
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: {
          config: {
            ...this.config,
            ...(this.config.entities ? { entities: [...this.config.entities] } : {}),
          },
        },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
customElements.define('heatingplan-card', HeatingPlanCard);
customElements.define('heatingplan-card-editor', HeatingPlanEditor);
const registry = window as unknown as { customCards?: unknown[] };
registry.customCards ??= [];
registry.customCards.push({
  type: 'heatingplan-card',
  name: 'Heating Plan Card',
  description: 'Heizpläne einfach gestalten – für Handy und Desktop.',
  preview: true,
});
console.info(`Heating Plan Card ${__VERSION__}`);
