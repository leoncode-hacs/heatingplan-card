# Verification record

Initial version: 1.0.0, September 2026.

## Automated checks

`npm run check` performs TypeScript validation, builds the real distributable
bundle, and runs 43 tests. The suite exercises:

- area and device fallback, full-day schedule conversion, API midnight format;
- date/calendar preservation, temperature limits/steps and HA timezone/DST;
- refusal to simplify conditions, mixed actions, HVAC modes or date restrictions;
- overlap checks and stale-editor protection before writes;
- API normalization, explicit negative responses and no retry of uncertain writes;
- actual bundle registration and visual card configuration;
- DOM create/edit/undo, double-click suppression, delete confirmation and cleanup;
- rendering untrusted entity, area and schedule names as text.

## Browser checks

The local demo was exercised in Chromium through the in-app browser:

- desktop room navigation and the seven-column overview;
- mobile layout at 390 px and narrow layout at 320 px;
- editing a temperature and saving, with confirmed readback;
- copying an active plan to the same days refused with a clear message;
- copying to a different thermostat and saving successfully;
- modal editor pinned to the viewport, including a scrolled host page;
- native time/number controls and labeled buttons;
- light/dark theme inspection and screenshots from example data.

Screenshots are from the demo, not from a real Home Assistant installation.
The demo calls an in-memory protocol implementation and never a real thermostat.

## Remaining environment verification

No production Home Assistant configuration or heating schedule was changed.
The Scheduler protocol was checked against its documented services and backend
API definitions. An authenticated live installation, permissions for the intended
user, actual scheduler version, cache refresh and real device behavior should be
verified after installing the card. The checks above do not establish those facts.
