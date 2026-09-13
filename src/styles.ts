// SPDX-License-Identifier: GPL-3.0-only
// Copyright 2026 Heating Plan Card contributors
export const styles = `
:host {
  display: block;
  --hp-safe-top: max(env(safe-area-inset-top, 0px), var(--safe-area-inset-top, 0px));
  --hp-safe-bottom: max(env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px));
  --hp-safe-left: max(env(safe-area-inset-left, 0px), var(--safe-area-inset-left, 0px));
  --hp-safe-right: max(env(safe-area-inset-right, 0px), var(--safe-area-inset-right, 0px));
  --hp-bg: var(--ha-card-background, var(--card-background-color, #f8faf9));
  --hp-fg: var(--primary-text-color, #203a36);
  --hp-muted: var(--secondary-text-color, #667b74);
  --hp-line: var(--divider-color, #dce5df);
  --hp-accent: #2c7762;
  --hp-accent-text: color-mix(in srgb, var(--hp-accent) 55%, var(--hp-fg));
  --hp-tint: color-mix(in srgb, var(--hp-accent) 9%, var(--hp-bg));
  --hp-warm: #c87745;
  color: var(--hp-fg);
  font-family: var(
    --primary-font-family,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif
  );
  font-size: 14px;
  line-height: 1.5;
  container-type: inline-size;
}
* {
  box-sizing: border-box;
}
button,
input,
select {
  font: inherit;
}
button {
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
button:focus-visible,
input:focus-visible,
select:focus-visible,
a:focus-visible {
  outline: 3px solid var(--hp-accent);
  outline-offset: 3px;
}
button {
  color: inherit;
}
h1,
h2,
h3,
p {
  margin: 0;
}
h1 {
  font-size: 28px;
  letter-spacing: -1px;
  font-weight: 650;
}
h2 {
  font-size: 21px;
  letter-spacing: -0.5px;
}
h3 {
  font-size: 16px;
}
small,
.muted {
  color: var(--hp-muted);
}
.app {
  border: 1px solid var(--hp-line);
  border-radius: 24px;
  background: var(--hp-bg);
  overflow: hidden;
  box-shadow: 0 5px 22px #123c2510;
}
.top {
  padding: 30px 30px 22px;
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--hp-line);
}
.eyebrow {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 10px;
  font-weight: 800;
  color: var(--hp-accent-text);
  margin-bottom: 5px;
}
.top-tools,
.row,
.between,
.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.between {
  justify-content: space-between;
}
.btn {
  border: 1px solid var(--hp-line);
  background: var(--hp-bg);
  border-radius: 12px;
  min-height: 44px;
  padding: 10px 16px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn:hover {
  background: var(--hp-tint);
}
.btn.primary {
  color: white;
  background: var(--hp-accent);
  border-color: var(--hp-accent);
}
.btn.primary:hover {
  filter: brightness(1.07);
}
.btn.quiet {
  border-color: transparent;
  background: transparent;
}
.btn.small {
  min-height: 44px;
  padding: 8px 12px;
}
.icon {
  width: 20px;
  height: 20px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 550px;
}
.rooms {
  padding: 22px 14px;
  background: color-mix(in srgb, var(--hp-accent) 3%, var(--hp-bg));
  border-right: 1px solid var(--hp-line);
}
.section-label {
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--hp-muted);
  font-weight: 650;
  margin: 0 12px 14px;
}
.room {
  width: 100%;
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 14px 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.room.active {
  background: var(--hp-bg);
  border-color: var(--hp-line);
  box-shadow: 0 3px 10px #14312408;
}
.room:hover {
  border-color: var(--hp-accent);
}
.room-icon {
  background: var(--hp-tint);
  color: var(--hp-accent-text);
  padding: 10px;
  border-radius: 12px;
  display: grid;
  place-items: center;
}
.room.active .room-icon {
  background: var(--hp-accent);
  color: white;
}
.room-copy {
  min-width: 0;
  flex: 1;
}
.room-copy strong {
  display: block;
  overflow-wrap: anywhere;
  font-size: 14px;
}
.room-copy small {
  display: block;
  font-size: 11px;
  overflow-wrap: anywhere;
}
.room-temp {
  font-size: 17px;
  font-weight: 600;
  white-space: nowrap;
}
.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--hp-warm);
  margin-right: 5px;
}
.main {
  padding: 28px;
  min-width: 0;
}
.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
}
.hero-title h2 {
  font-size: 26px;
}
.pill {
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 20px;
  background: var(--hp-tint);
  color: var(--hp-accent-text);
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-weight: 650;
}
.pill.warn {
  background: color-mix(in srgb, #c47c39 12%, var(--hp-bg));
  color: var(--hp-fg);
}
.readings {
  display: flex;
  gap: 30px;
  margin-top: 17px;
  flex-wrap: wrap;
}
.reading small {
  display: block;
  font-size: 11px;
}
.reading strong {
  font-size: 30px;
  font-weight: 550;
  letter-spacing: -1px;
}
.reading span {
  font-size: 15px;
  letter-spacing: 0;
  color: var(--hp-muted);
}
.next {
  margin: 16px 0 22px;
  padding: 12px 15px;
  border: 1px solid var(--hp-line);
  border-radius: 12px;
  color: var(--hp-muted);
  font-size: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
}
.next strong {
  color: var(--hp-fg);
}
.week-head {
  margin-bottom: 12px;
}
.day-tabs {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
  margin-bottom: 15px;
}
.day-tab {
  min-width: 0;
  padding: 10px 4px;
  min-height: 48px;
  border: 1px solid var(--hp-line);
  border-radius: 11px;
  background: transparent;
  font-size: 12px;
}
.day-tab.active {
  background: var(--hp-accent);
  color: #fff;
  border-color: var(--hp-accent);
}
.day-tab .today {
  display: block;
  height: 3px;
  width: 12px;
  background: var(--hp-warm);
  margin: 3px auto 0;
  border-radius: 2px;
}
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 18px;
}
.week-column {
  border: 1px solid var(--hp-line);
  border-radius: 10px;
  padding: 5px;
  min-width: 0;
}
.week-column.today-col {
  border-color: var(--hp-accent);
}
.week-column > small {
  display: block;
  text-align: center;
  margin-bottom: 5px;
  font-size: 10px;
}
.segment {
  border: 0;
  border-left: 3px solid var(--hp-accent);
  border-radius: 5px;
  margin-bottom: 3px;
  padding: 6px 5px;
  background: var(--hp-tint);
  font-size: 10px;
  line-height: 1.4;
  overflow: hidden;
}
.segment.warm {
  border-color: var(--hp-warm);
  background: color-mix(in srgb, var(--hp-warm) 13%, var(--hp-bg));
}
.segment strong {
  display: block;
  font-size: 12px;
}
.segment.empty {
  border-color: var(--hp-line);
  color: var(--hp-muted);
}
.plan {
  border: 1px solid var(--hp-line);
  border-radius: 16px;
  margin: 14px 0;
  overflow: hidden;
}
.plan-head {
  padding: 15px 17px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.plan-head h3 {
  font-size: 15px;
  overflow-wrap: anywhere;
}
.plan-head small {
  font-size: 12px;
}
.plan.paused {
  opacity: 0.7;
}
.plan-body {
  border-top: 1px solid var(--hp-line);
}
.period {
  display: grid;
  grid-template-columns: 30px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 12px 17px;
  border-bottom: 1px solid var(--hp-line);
}
.period:last-child {
  border: 0;
}
.period .icon {
  color: var(--hp-muted);
}
.period strong {
  font-weight: 600;
}
.period-temp {
  font-size: 18px;
  font-weight: 600;
}
.period-temp span {
  font-size: 12px;
  color: var(--hp-muted);
}
.period.active-period {
  background: var(--hp-tint);
}
.period small {
  display: block;
  font-size: 11px;
}
.plan-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-top: 1px solid var(--hp-line);
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  padding: 10px 4px;
  min-height: 44px;
  font-size: 12px;
}
.switch {
  width: 31px;
  height: 19px;
  border-radius: 20px;
  background: var(--hp-muted);
  display: inline-block;
  position: relative;
}
.switch:after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  background: white;
  width: 13px;
  height: 13px;
  border-radius: 50%;
}
.toggle[aria-checked="true"] .switch {
  background: var(--hp-accent);
}
.toggle[aria-checked="true"] .switch:after {
  left: 15px;
}
.empty-state {
  text-align: center;
  padding: 35px 20px;
  border: 1px dashed var(--hp-line);
  border-radius: 16px;
}
.empty-state .icon {
  width: 35px;
  height: 35px;
  color: var(--hp-accent-text);
  margin-bottom: 12px;
}
.empty-state p {
  margin: 7px auto 18px;
  max-width: 330px;
  color: var(--hp-muted);
}
.status {
  margin: 16px 24px 0;
  border-radius: 12px;
  padding: 12px 16px;
  background: var(--hp-tint);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.status.error {
  background: color-mix(in srgb, #be3d32 10%, var(--hp-bg));
  color: var(--error-color, #a7352c);
}
.footnote {
  font-size: 11px;
  color: var(--hp-muted);
  margin-top: 18px;
}
.sheet {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  border: 0;
  color: var(--hp-fg);
  position: fixed;
  inset: 0;
  background: transparent;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.sheet::backdrop {
  background: #142b2866;
  backdrop-filter: blur(4px);
}
.sheet:not([open]) {
  display: none;
}
.dialog {
  width: min(730px, 100%);
  max-height: calc(100dvh - 48px);
  background: var(--hp-bg);
  border: 1px solid var(--hp-line);
  border-radius: 22px;
  box-shadow: 0 24px 80px #0003;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.dialog-head {
  flex: 0 0 auto;
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--hp-line);
  gap: 16px;
}
.dialog-body {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  padding: 24px;
  overflow: auto;
  overscroll-behavior: contain;
}
.dialog-footer {
  flex: 0 0 auto;
  flex-wrap: wrap;
  border-top: 1px solid var(--hp-line);
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  background: var(--hp-bg);
}
.dialog-footer .actions {
  flex-wrap: wrap;
  min-width: 0;
  margin-left: auto;
}
.field {
  display: block;
  margin-bottom: 18px;
  font-size: 12px;
  font-weight: 650;
}
.field input,
.field select {
  display: block;
  width: 100%;
  margin-top: 7px;
}
.input,
input[type="time"],
input[type="number"],
select {
  border: 1px solid var(--hp-line);
  border-radius: 10px;
  background: var(--hp-bg);
  color: var(--hp-fg);
  min-height: 46px;
  padding: 10px 12px;
  font-size: 15px;
  max-width: 100%;
}
.two-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.day-choice {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  margin: 9px 0;
}
.day-choice label {
  position: relative;
  cursor: pointer;
}
.day-choice input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}
.day-choice span {
  display: grid;
  place-items: center;
  border: 1px solid var(--hp-line);
  border-radius: 9px;
  min-height: 46px;
}
.day-choice input:checked + span {
  background: var(--hp-accent);
  color: white;
  border-color: var(--hp-accent);
}
.day-choice input:focus-visible + span {
  outline: 3px solid var(--hp-accent);
  outline-offset: 3px;
}
.presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.preset {
  border: 1px solid var(--hp-line);
  border-radius: 20px;
  background: transparent;
  padding: 8px 12px;
  font-size: 12px;
  min-height: 44px;
}
.edit-period {
  display: grid;
  grid-template-columns: minmax(100px, 1fr) minmax(180px, 1.2fr) 44px;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--hp-line);
}
.edit-period > label {
  font-size: 11px;
  color: var(--hp-muted);
}
.edit-period input[type="time"] {
  display: block;
  width: 100%;
  margin-top: 4px;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 5px;
}
.stepper input {
  flex: 1 1 70px;
  width: 90px;
  text-align: center;
  appearance: textfield;
  padding: 8px 3px;
  min-width: 0;
}
.stepper input::-webkit-inner-spin-button {
  appearance: none;
}
.stepper button {
  flex: 0 0 44px;
  width: 44px;
  height: 46px;
  padding: 0;
  border: 1px solid var(--hp-line);
  background: var(--hp-tint);
  border-radius: 10px;
  font-size: 22px;
}
.stepper-label {
  font-size: 11px;
  color: var(--hp-muted);
  margin-bottom: 4px;
}
.delete {
  border: 0;
  background: transparent;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: var(--hp-muted);
}
.helper {
  font-size: 12px;
  color: var(--hp-muted);
  margin: 12px 0;
}
.notice {
  border: 1px solid var(--hp-line);
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 12px;
  color: var(--hp-muted);
  margin-top: 16px;
}
.inline-error {
  color: var(--error-color, #a7352c);
  font-size: 13px;
  padding: 10px 0;
}
.quick-value {
  font-size: 48px;
  text-align: center;
  margin: 15px 0;
}
.room-select {
  display: none;
}
.plan-actions {
  display: flex;
  gap: 4px;
}
.loading {
  padding: 60px 24px;
  text-align: center;
  color: var(--hp-muted);
}
.skeleton {
  height: 14px;
  background: var(--hp-line);
  border-radius: 6px;
  margin: 12px auto;
  width: 60%;
  animation: pulse 1.5s infinite;
}
.skeleton:nth-child(2) {
  width: 40%;
}
@keyframes pulse {
  50% {
    opacity: 0.4;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    scroll-behavior: auto !important;
  }
}
@container (max-width:760px) {
  .top {
    padding: 22px 20px;
  }
  .top h1 {
    font-size: 24px;
  }
  .layout {
    grid-template-columns: 1fr;
  }
  .rooms {
    display: none;
  }
  .main {
    padding: 20px;
  }
  .room-select {
    display: block;
    margin-bottom: 20px;
    width: 100%;
  }
  .week-grid {
    display: none;
  }
  .hero-title h2 {
    font-size: 24px;
  }
  .hero {
    display: block;
  }
  .hero > div:last-child {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    text-align: left !important;
  }
  .hero > div:last-child br {
    display: none;
  }
  .hero > div:last-child .btn {
    margin-top: 0 !important;
  }
  .hero > .btn {
    font-size: 12px;
    padding: 8px 10px;
  }
  .top-tools .text {
    display: none;
  }
  .top-tools .btn {
    padding: 10px;
  }
  .readings {
    gap: 24px;
  }
  .reading strong {
    font-size: 28px;
  }
  .status {
    margin: 12px 16px 0;
    flex-wrap: wrap;
  }
  .status > span {
    flex: 1;
    min-width: 170px;
  }
  .day-tab {
    min-height: 48px;
  }
  .plan-head {
    padding: 14px;
  }
  .plan-actions .btn {
    font-size: 12px;
    padding: 8px;
  }
  .plan-footer {
    flex-wrap: wrap;
  }
  .footnote {
    font-size: 11px;
  }
}
@media (max-width: 600px) {
  .sheet {
    padding: 0;
    align-items: stretch;
  }
  .dialog {
    max-height: 100dvh;
    height: 100dvh;
    width: 100%;
    border-radius: 0;
    border: 0;
  }
  .dialog-head {
    padding: calc(16px + var(--hp-safe-top)) max(16px, var(--hp-safe-right)) 16px max(16px, var(--hp-safe-left));
  }
  .dialog-body {
    padding: 18px max(16px, var(--hp-safe-right)) 18px max(16px, var(--hp-safe-left));
  }
  .dialog-footer {
    padding: 12px max(16px, var(--hp-safe-right)) calc(12px + var(--hp-safe-bottom)) max(16px, var(--hp-safe-left));
  }
  .two-fields {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .edit-period {
    grid-template-columns: minmax(0, 1fr) 44px;
    gap: 12px;
    padding: 16px 0;
  }
  .edit-period > .period-time { grid-column: 1; grid-row: 1; }
  .edit-period > .period-settings { grid-column: 1 / -1; grid-row: 2; }
  .edit-period > .delete { grid-column: 2; grid-row: 1; width: 44px; }
  .stepper { max-width: 260px; width: 100%; }
  .stepper input { width: 90px; }
  .stepper button { width: 44px; }
  .dialog-footer .btn {
    padding: 10px 14px;
  }
  .top-tools {
    gap: 4px;
  }
}
.dialog-head > div { min-width: 0; }
.dialog-head > button { flex: 0 0 auto; }
.edit-period > * { min-width: 0; }
.edit-period input[type="time"] { min-width: 0; max-width: 100%; -webkit-appearance: none; appearance: none; }
.edit-period input[type="time"]::-webkit-date-and-time-value { text-align: left; }
.period-settings { display: grid; gap: 10px; min-width: 0; }
.period-mode { display: block; font-size: 11px; color: var(--hp-muted); }
.period-mode select { display: block; width: 100%; margin-top: 4px; min-width: 0; }
.off-period { padding: 14px 0; font-weight: 600; }
.mode-buttons { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 20px; }
.quick-dialog { max-width: 420px; height: auto; }
.quick-stepper { justify-content: center; max-width: 270px; margin: 0 auto; }
.quick-stepper input { font-size: 30px; min-height: 64px; }
@media (max-width: 600px) {
  .quick-dialog { height: auto; align-self: flex-end; border-radius: 20px 20px 0 0; }
  .quick-dialog .dialog-head { padding-top: 20px; }
  .quick-dialog { max-height: calc(100dvh - var(--hp-safe-top)); }
  .dialog-footer > .actions { flex: 1; justify-content: flex-end; }
  .dialog-footer .btn { min-width: 0; white-space: normal; text-align: center; }
}
.week-navigation { display:flex; align-items:center; gap:2px; }
.day-tab small { display:block; font-size:10px; color:inherit; opacity:.8; }
.week-plan + .week-plan { border-top:1px solid var(--hp-line); padding-top:8px; margin-top:8px; }
.week-plan-label { font-size:10px; margin-bottom:6px; overflow-wrap:anywhere; }
.week-plan-label strong,.week-plan-label span { display:block; }
.week-plan-label > span { color:var(--hp-muted); }
.calendar-note { display:block; font-size:11px; color:var(--hp-muted); margin-top:3px; }
.week-plan.paused .segment { background:color-mix(in srgb,var(--hp-muted) 8%,var(--hp-bg)); border-color:var(--hp-line); color:var(--hp-muted); }
.week-plan.paused .week-plan-label { color:var(--hp-muted); }
.uncertain { border-style:dashed; }
.week-plan.uncertain { border:1px dashed var(--hp-line); border-radius:7px; padding:4px; }
@container(max-width:450px){.week-head{flex-wrap:wrap}.week-navigation{margin-left:auto}}
@container(max-width:350px){.day-tab small{display:none}.day-tab{padding-inline:1px}}
.top > div:first-child { min-width:0; overflow-wrap:anywhere; }
.top-tools { flex-shrink:0; }
.top-tools > button { min-width:44px; }
.overview { padding:28px; }
.overview-head { gap:18px; margin-bottom:22px; flex-wrap:wrap; }
.overview-head p.muted { margin-top:6px; }
.overview-list { display:grid; gap:10px; }
.overview-room { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr) 20px; gap:20px; align-items:center; padding:20px; width:100%; text-align:left; background:var(--hp-bg); border:1px solid var(--hp-line); border-radius:16px; }
.overview-room:hover { background:var(--hp-tint); }
.overview-room strong,.overview-room small { display:block; overflow-wrap:anywhere; }
.overview-room-name > strong { font-size:17px; }
.overview-event > strong { font-size:20px; }
.overview-time { color:var(--hp-accent-text); font-weight:600; }
.overview-room.paused { color:var(--hp-muted); }
@container(max-width:600px) {
  .top { flex-wrap:wrap; gap:12px; }
  .top-tools { margin-left:auto; }
  .overview { padding:20px; }
  .overview-room { grid-template-columns:minmax(0,1fr) 20px; gap:12px; padding:16px; }
  .overview-room-name { grid-column:1; }
  .overview-event { grid-column:1; }
  .overview-room > .icon { grid-column:2; grid-row:1 / 3; }
}
`;
