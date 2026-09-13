/*! Heating Plan Card v1.2.0 | Copyright 2026 Heating Plan Card contributors | SPDX-License-Identifier: GPL-3.0-only | Source: https://github.com/leoncode-hacs/heatingplan-card */
"use strict";(()=>{var u=["mon","tue","wed","thu","fri","sat","sun"],N=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"],M=["Mo","Di","Mi","Do","Fr","Sa","So"];function k(i){let e=/^(\d{2}):(\d{2})(?::00)?$/.exec(i);if(!e)return NaN;let t=Number(e[1]),s=Number(e[2]);return t===24&&s===0?1440:t<24&&s<60?t*60+s:NaN}function P(i){return i==="00:00:00"||i==="00:00"||i==="23:59:59"?1440:k(i)}function D(i){return`${String(Math.floor(i/60)).padStart(2,"0")}:${String(i%60).padStart(2,"0")}`}function g(i){return typeof i=="number"&&Number.isFinite(i)?i.toLocaleString("de-DE",{maximumFractionDigits:1}):"\u2013"}function L(i,e){let s=(e??Object.keys(i.states).filter(a=>a.startsWith("climate."))).map(a=>{let n=i.states[a];if(!n||!a.startsWith("climate."))return null;let r=i.entities?.[a],o=r?.area_id||(r?.device_id?i.devices?.[r.device_id]?.area_id:void 0),d=o?i.areas?.[o]?.name:void 0,p=String(n.attributes.friendly_name||a.slice(8).replaceAll("_"," "));return{id:a,name:d||p,detail:d&&d!==p?p:a,state:n}}).filter(a=>a!==null);for(let a of s)s.filter(n=>n.name===a.name).length>1&&(a.detail=`${a.detail} \xB7 ${a.id}`);return s.sort((a,n)=>a.name.localeCompare(n.name,"de"))}function b(i){return[...new Set((i.timeslots||[]).flatMap(e=>(e.actions||[]).map(t=>t.entity_id)).filter(e=>typeof e=="string"))]}function Z(i){return i.includes("daily")||u.every(e=>i.includes(e))?"Jeden Tag":i.length===5&&u.slice(0,5).every(e=>i.includes(e))?"Montag bis Freitag":i.length===2&&i.includes("sat")&&i.includes("sun")?"Wochenende":i.includes("workday")?"Arbeitstage (Arbeitskalender)":i.includes("weekend")?"Freie Tage (Arbeitskalender)":u.filter(e=>i.includes(e)).map(e=>M[u.indexOf(e)]).join(", ")}function re(i,e){return i.weekdays.includes("daily")||i.weekdays.includes(u[e])}function v(i,e){let t=e.states[i.entity_id]?.state;return t!==void 0?t==="on"||t==="triggered":i.enabled!==!1}function y(i,e){let t=i.states[e]?.attributes||{};return{min:Number.isFinite(t.min_temp)?t.min_temp:5,max:Number.isFinite(t.max_temp)?t.max_temp:30,step:Number.isFinite(t.target_temp_step)&&t.target_temp_step>0?t.target_temp_step:.5}}function x(i,e,t){return i.states[e]?.attributes.hvac_modes?.includes(t)===!0}function _(i){let e=i.actions[0];return e?.service==="climate.turn_off"||e?.service==="climate.set_hvac_mode"&&e.service_data?.hvac_mode==="off"}function J(i,e){return _(i)?"Aus":`${g(i.actions[0]?.service_data?.temperature)} ${e}`}function w(i){if(b(i).length!==1||!b(i)[0]?.startsWith("climate."))return"Dieser Plan steuert mehrere Ger\xE4te oder andere Aktionen.";if(i.repeat_type&&i.repeat_type!=="repeat")return"Dieser Plan hat eine besondere Wiederholungsregel.";if(i.start_date||i.end_date)return"Dieser Plan gilt nur in einem bestimmten Zeitraum.";if(!i.weekdays.length||i.weekdays.some(t=>!u.includes(t)&&!["daily","workday","weekend"].includes(t))||i.weekdays.some(t=>t==="workday"||t==="weekend")&&i.weekdays.length!==1)return"Dieser Plan kombiniert besondere Kalenderregeln.";if(!i.timeslots.length)return"Dieser Plan enth\xE4lt keine Heizzeiten.";let e=0;for(let t of i.timeslots){let s=t.actions[0];if(t.conditions?.length||t.track_conditions)return"Dieser Plan enth\xE4lt zus\xE4tzliche Bedingungen.";let a=s?.service_data||{},n=s?.service==="climate.turn_off"&&Object.keys(a).length===0||s?.service==="climate.set_hvac_mode"&&a.hvac_mode==="off"&&Object.keys(a).length===1,r=s?.service==="climate.set_temperature"&&Number.isFinite(a.temperature)&&Object.keys(a).every(p=>p==="temperature"||p==="hvac_mode"&&a.hvac_mode==="heat");if(t.actions.length!==1||!n&&!r)return"Dieser Plan enth\xE4lt zus\xE4tzliche Einstellungen oder Aktionen.";let o=k(t.start),d=t.stop?P(t.stop):NaN;if(o!==e||!Number.isFinite(d)||d<=o)return"Dieser Plan verwendet einzelne Schaltzeiten oder Zeitl\xFCcken.";e=d}return e===1440?null:"Dieser Plan deckt nicht den ganzen Tag ab."}function T(i){if(w(i))throw new Error("Dieser Plan ist nur zur Ansicht verf\xFCgbar.");return{name:i.name||"",entity:b(i)[0],weekdays:i.weekdays.includes("daily")?[...u]:[...i.weekdays],periods:i.timeslots.map(e=>({start:k(e.start),temperature:_(e)?20:Number(e.actions[0].service_data?.temperature),..._(e)?{mode:"off"}:e.actions[0].service_data?.hvac_mode==="heat"?{mode:"heat"}:{}}))}}function V(i,e){let t=y(e,i),s=a=>{let n=e.config?.unit_system?.temperature==="\xB0F"?a*1.8+32:a;return Math.min(t.max,Math.max(t.min,Math.round(n/t.step)*t.step))};return{name:"Mein Heizplan",entity:i,weekdays:u.slice(0,5),periods:[{start:0,temperature:s(17)},{start:390,temperature:s(21)},{start:540,temperature:s(18)},{start:1020,temperature:s(21)},{start:1320,temperature:s(17)}]}}function R(i,e){if(!e.states[i.entity]||!i.entity.startsWith("climate."))return"Bitte w\xE4hle ein vorhandenes Thermostat.";if(!i.name.trim()||i.name.length>80)return"Bitte gib einen Namen mit h\xF6chstens 80 Zeichen ein.";if(!i.weekdays.length||new Set(i.weekdays).size!==i.weekdays.length||i.weekdays.some(a=>!u.includes(a)&&!["workday","weekend"].includes(a))||i.weekdays.some(a=>a==="workday"||a==="weekend")&&i.weekdays.length!==1)return"Bitte w\xE4hle mindestens einen Wochentag.";if(!i.periods.length||i.periods[0].start!==0||i.periods.length>24)return"Der Tag muss um 00:00 beginnen und darf h\xF6chstens 24 Abschnitte enthalten.";let t=y(e,i.entity),s=i.periods.some(a=>a.mode==="off");if(s&&!x(e,i.entity,"off"))return"Dieses Thermostat unterst\xFCtzt den Aus-Modus nicht.";if((i.periods.some(a=>a.mode==="heat")||s&&i.periods.some(a=>a.mode!=="off"))&&!x(e,i.entity,"heat"))return"Dieses Thermostat kann nicht automatisch in den Heizmodus zur\xFCckkehren.";for(let a=0;a<i.periods.length;a++){let n=i.periods[a];if(!Number.isInteger(n.start)||n.start<0||n.start>=1440||a>0&&n.start<=i.periods[a-1].start)return"Die Uhrzeiten m\xFCssen in aufsteigender Reihenfolge liegen und d\xFCrfen sich nicht wiederholen.";if(n.mode&&n.mode!=="heat"&&n.mode!=="off")return"Bitte w\xE4hle Heizen oder Aus.";if(n.mode!=="off"){if(!Number.isFinite(n.temperature)||n.temperature<t.min||n.temperature>t.max)return`Bitte w\xE4hle Temperaturen zwischen ${g(t.min)} und ${g(t.max)} \xB0C.`;if(Math.abs(n.temperature/t.step-Math.round(n.temperature/t.step))>1e-5)return`Dieses Thermostat unterst\xFCtzt Schritte von ${g(t.step)} \xB0C.`}}return null}function Y(i,e){return{name:i.name.trim(),weekdays:[...i.weekdays],repeat_type:e?.repeat_type||"repeat",tags:e?.tags||["heatingplan-card"],timeslots:i.periods.map((t,s)=>({start:`${D(t.start)}:00`,stop:i.periods[s+1]?`${D(i.periods[s+1].start)}:00`:"00:00:00",actions:[t.mode==="off"?{entity_id:i.entity,service:"climate.set_hvac_mode",service_data:{hvac_mode:"off"}}:{entity_id:i.entity,service:"climate.set_temperature",service_data:{temperature:t.temperature,...t.mode==="heat"||i.periods.some(a=>a.mode==="off")?{hvac_mode:"heat"}:{}}}]})),...e?{schedule_id:e.schedule_id}:{}}}function E(i){return JSON.stringify([i.name,i.weekdays,i.timeslots,i.repeat_type,i.start_date,i.end_date,i.tags])}function I(i,e,t,s){let a=(n,r)=>n.length===1&&n[0]==="workday"&&r.length===1&&r[0]==="weekend"||r.length===1&&r[0]==="workday"&&n.length===1&&n[0]==="weekend"?!1:[...n,...r].some(o=>["workday","weekend","daily"].includes(o))?!0:n.some(o=>r.includes(o));return e.filter(n=>n.schedule_id!==s&&b(n).includes(i.entity)&&v(n,t)&&a(i.weekdays,n.weekdays))}function q(i,e=new Date){let t=new Intl.DateTimeFormat("en-GB",{timeZone:i.config?.time_zone,weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(e),s=a=>t.find(n=>n.type===a)?.value||"";return{day:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(s("weekday")),minute:Number(s("hour"))*60+Number(s("minute"))}}function U(i,e,t){let s=q(e),a;for(let n=0;n<=7;n++)for(let r of i)if(!(!v(r,e)||!b(r).includes(t)||w(r)||!re(r,(s.day+n)%7)))for(let o of r.timeslots){let d=n*1440+k(o.start)-s.minute;d>0&&(!a||d<a.minutes)&&(a={minutes:d,temperature:Number(o.actions[0].service_data?.temperature),off:_(o)})}return a}function G(i){let e=0,t=0;if(i.forEach((a,n)=>{let r=(i[n+1]?.start??1440)-a.start;r>t&&(t=r,e=n)}),t<30)return i;let s=structuredClone(i);return s.splice(e+1,0,{start:Math.floor((i[e].start+t/2)/15)*15,temperature:i[e].temperature,...i[e].mode?{mode:i[e].mode}:{}}),s}var O="binary_sensor.workday_sensor";function $(i,e=new Date){let t=new Intl.DateTimeFormat("en-CA",{timeZone:i.config?.time_zone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(e),s=a=>t.find(n=>n.type===a).value;return`${s("year")}-${s("month")}-${s("day")}`}function Q(i,e){let t=new Date(`${i}T12:00:00Z`);return t.setUTCDate(t.getUTCDate()+e),t.toISOString().slice(0,10)}function F(i){return(new Date(`${i}T12:00:00Z`).getUTCDay()+6)%7}function C(i,e=0,t=new Date){let s=$(i,t),a=Q(s,-F(s)+e*7);return u.map((n,r)=>Q(a,r))}function z(i){return`${i.slice(8,10)}.${i.slice(5,7)}.`}function A(i){return i.weekdays.some(e=>e==="workday"||e==="weekend")}function S(i,e,t){if(i.start_date&&e<i.start_date||i.end_date&&e>i.end_date)return"no";let s=i.weekdays;if(!s.length||s.includes("daily"))return"yes";if(A(i)){if(s.length!==1)return"unknown";let a=t[e]?.workday;return typeof a!="boolean"?"unknown":(s[0]==="workday"?a:!a)?"yes":"no"}return s.includes(u[F(e)])?"yes":s.some(a=>!u.includes(a))?"unknown":"no"}function X(i,e){let t=i.states[O];return JSON.stringify([e,$(i),i.config?.time_zone,t?.state,t?.attributes])}async function ee(i,e,t=8e3){let s=i.states[O],a=$(i),n=await Promise.all(e.map(async r=>{if(!s)return[r,{workday:F(r)<5,source:"standard"}];if(r===a&&(s.state==="on"||s.state==="off"))return[r,{workday:s.state==="on",source:"sensor"}];let o;try{let d=i.callWS({type:"call_service",domain:"workday",service:"check_date",service_data:{check_date:r},target:{entity_id:O},return_response:!0}),h=(await Promise.race([d,new Promise((l,m)=>{o=setTimeout(()=>m(new Error("Calendar timeout")),t)})]))?.response?.[O]?.workday;if(typeof h=="boolean")return[r,{workday:h,source:"calendar"}]}catch{}finally{o&&clearTimeout(o)}return[r,{workday:null,source:"unknown"}]}));return Object.fromEntries(n)}var W=class{hass;constructor(e){this.hass=e}async list(){let e=await this.hass().callWS({type:"scheduler"});if(!Array.isArray(e))throw new Error("Die Scheduler-Integration liefert ein unbekanntes Antwortformat.");if(e.some(t=>!t||typeof t.schedule_id!="string"||!Array.isArray(t.timeslots)||!Array.isArray(t.weekdays)))throw new Error("Die Zeitpl\xE4ne konnten nicht sicher gelesen werden.");return e}async item(e){let t=await this.hass().callWS({type:"scheduler/item",schedule_id:e});if(!t||t.schedule_id!==e||!Array.isArray(t.timeslots))throw new Error("Der Heizplan ist nicht mehr verf\xFCgbar. Bitte neu laden.");return t}async save(e,t){let s=R(e,this.hass());if(s)throw new Error(s);let a=await this.list(),n=!0;if(t){let l=await this.item(t.schedule_id);if(n=l.enabled!==!1,E(l)!==E(t)||w(l))throw new Error("Dieser Plan wurde inzwischen ge\xE4ndert. Bitte schlie\xDFe den Editor und \xF6ffne den aktuellen Stand.")}if(I(e,a,this.hass(),t?.schedule_id).length&&n)throw new Error("F\xFCr diese Tage ist bereits ein anderer Heizplan aktiv. Bitte pausiere ihn zuerst oder w\xE4hle andere Tage.");let o=Y(e,t),d=await this.hass().callApi("POST",t?"scheduler/edit":"scheduler/add",o);if(d===!1||d&&typeof d=="object"&&"success"in d&&d.success===!1)throw new Error("Die Scheduler-Integration hat den Heizplan nicht gespeichert.");let p=l=>JSON.stringify([l.name.trim(),l.entity,[...l.weekdays].sort(),l.periods.map(m=>m.mode==="off"?[m.start,"off"]:[m.start,m.mode||"temperature",m.temperature])]),h={...e,periods:e.periods.map(l=>l.mode!=="off"&&e.periods.some(m=>m.mode==="off")?{...l,mode:"heat"}:l)};for(let l of[0,100,250,500,1e3]){l&&await new Promise(H=>setTimeout(H,l));let m=await this.list();if(m.find(H=>(t?H.schedule_id===t.schedule_id:!a.some(ae=>ae.schedule_id===H.schedule_id))&&!w(H)&&p(T(H))===p(h)))return m}throw new Error("Der Speicherauftrag wurde gesendet, konnte aber noch nicht best\xE4tigt werden. Bitte neu laden, bevor du erneut speicherst.")}async remove(e){let t=await this.item(e.schedule_id);if(E(t)!==E(e))throw new Error("Dieser Plan wurde inzwischen ge\xE4ndert. Bitte pr\xFCfe ihn erneut.");if(!(await this.hass().callApi("POST","scheduler/remove",{schedule_id:e.schedule_id}))?.success)throw new Error("Der Heizplan wurde nicht gel\xF6scht.");for(let a of[0,100,250,500,1e3]){a&&await new Promise(r=>setTimeout(r,a));let n=await this.list();if(!n.some(r=>r.schedule_id===e.schedule_id))return n}throw new Error("Der L\xF6schauftrag wurde gesendet. Bitte lade neu, um das Ergebnis zu pr\xFCfen.")}async toggle(e,t){let s=await this.item(e.schedule_id);if(s.entity_id!==e.entity_id)throw new Error("Der Plan wurde ver\xE4ndert. Bitte neu laden.");if(t){let a=await this.list();if(b(s).flatMap(r=>I({name:"",entity:r,weekdays:s.weekdays,periods:[]},a,this.hass(),s.schedule_id)).length)throw new Error("Ein anderer Plan f\xFCr diese Tage ist bereits aktiv. Bitte pausiere ihn zuerst.")}await this.hass().callService("switch",t?"turn_on":"turn_off",{entity_id:s.entity_id})}};var te=`
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
`;var c=i=>String(i??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),ie={home:"M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8",heat:"M8 3c-5 6 3 6 0 12m5-12c-5 6 3 6 0 12m5-12c-5 6 3 6 0 12M4 21h16",clock:"M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",plus:"M12 5v14M5 12h14",close:"m6 6 12 12M18 6 6 18",edit:"m14 5 5 5M4 20l5-1L21 7l-4-4L5 15z",copy:"M9 8h11v13H9zM5 16H3V3h12v2",refresh:"M20 8a8 8 0 1 0 0 9M20 3v5h-5",moon:"M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12",sun:"M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",bin:"M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7",check:"m5 12 4 4L19 6",arrow:"m8 5 7 7-7 7",lock:"M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3"},f=i=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${ie[i]||ie.home}"/></svg>`,B=class extends HTMLElement{root=this.attachShadow({mode:"open"});config={type:"custom:heatingplan-card"};currentHass;schedules=[];loaded=!1;error="";message="";busy=!1;room="";day=0;weekOffset=0;calendar={};calendarKey="";calendarExpires=0;calendarRequest=0;edit;quick;deletion;undo;unsubscribe;subscribing=!1;subscribedConnection;refreshId=0;timer;queued=!1;renderedMarkup="";api=new W(()=>{if(!this.currentHass)throw new Error("Home Assistant ist noch nicht verbunden.");return this.currentHass});constructor(){super(),this.root.addEventListener("click",e=>{this.handleClick(e)}),this.root.addEventListener("change",e=>this.change(e)),this.root.addEventListener("input",e=>this.input(e)),this.root.addEventListener("keydown",e=>this.key(e))}setConfig(e){if(!e||e.type!=="custom:heatingplan-card")throw new Error("Verwende type: custom:heatingplan-card.");if(e.entities&&(!Array.isArray(e.entities)||e.entities.some(t=>typeof t!="string"||!t.startsWith("climate."))))throw new Error("entities muss eine Liste von Thermostaten sein.");this.config={...e},this.requestRender()}set hass(e){let t=!this.currentHass;this.currentHass=e,t&&(this.day=q(e).day),!this.edit&&!this.quick&&!this.deletion&&this.requestRender(),this.isConnected&&(this.subscribe(),t&&this.refresh(),this.refreshCalendar())}get hass(){return this.currentHass}getCardSize(){return 9}getGridOptions(){return{columns:24,rows:10,min_columns:6,min_rows:6}}static getConfigElement(){return document.createElement("heatingplan-card-editor")}static getStubConfig(){return{type:"custom:heatingplan-card",title:"Heizplan"}}connectedCallback(){this.render(),this.currentHass&&(this.subscribe(),this.refresh()),this.timer=setInterval(()=>{this.refreshCalendar(),!this.edit&&!this.quick&&!this.deletion&&this.requestRender(),!this.unsubscribe&&this.currentHass&&!this.busy&&this.refresh()},6e4)}disconnectedCallback(){this.unsubscribe?.(),this.unsubscribe=void 0,this.subscribedConnection=void 0,this.refreshId++,this.calendarRequest++,this.calendarKey="",this.timer&&clearInterval(this.timer)}requestRender(){this.queued||(this.queued=!0,queueMicrotask(()=>{this.queued=!1,this.isConnected&&this.render()}))}subscribe(){let e=this.currentHass?.connection;!e||this.subscribing||e===this.subscribedConnection||(this.unsubscribe?.(),this.unsubscribe=void 0,this.subscribedConnection=e,this.subscribing=!0,e.subscribeMessage(()=>{this.busy||this.refresh()},{type:"scheduler_updated"}).then(t=>{this.isConnected&&this.currentHass?.connection===e?this.unsubscribe=t:t()}).catch(()=>{this.subscribedConnection=void 0}).finally(()=>{this.subscribing=!1}))}async refresh(){let e=++this.refreshId;try{let t=await this.api.list();if(e!==this.refreshId||!this.isConnected)return;this.schedules=t,this.refreshCalendar(),this.loaded=!0,this.error=""}catch(t){if(e!==this.refreshId)return;this.error=this.errorText(t)}!this.edit&&!this.quick&&!this.deletion&&this.requestRender()}async refreshCalendar(e=!1){if(!this.currentHass||!this.isConnected||!this.schedules.some(A))return;let t=C(this.hass,this.weekOffset),s=X(this.hass,t);if(!e&&s===this.calendarKey&&Date.now()<this.calendarExpires)return;let a=++this.calendarRequest;this.calendarKey=s,this.calendarExpires=Date.now()+3e5,this.calendar={},!this.edit&&!this.quick&&!this.deletion&&this.requestRender();let n=await ee(this.hass,t);a!==this.calendarRequest||!this.isConnected||(this.calendar=n,!this.edit&&!this.quick&&!this.deletion&&this.requestRender())}errorText(e){return e instanceof Error?e.message:"Die Verbindung ist unterbrochen. Bitte versuche es erneut."}rooms(){return this.currentHass?L(this.currentHass,this.config.entities):[]}selected(){let e=this.rooms();return e.find(t=>t.id===this.room)||e[0]}unit(){return this.currentHass?.config?.unit_system?.temperature||"\xB0C"}render(){let e=this.root.querySelector(".dialog-body")?.scrollTop||0,t=this.root.activeElement?.getAttribute("aria-label"),s=this.root.querySelector("dialog"),a=this.rooms(),n=this.selected();n&&(this.room=n.id);let r=this.config.title||"Heizplan",o=`<style>${te}</style><section class="app" ${this.edit||this.quick||this.deletion?"inert":""} aria-label="${c(r)}">
      <header class="top"><div><h1>${c(r)}</h1></div><div class="top-tools"><button class="btn" data-action="refresh" aria-label="Heizpl\xE4ne neu laden" ${this.busy?"disabled":""}>${f("refresh")}</button><button class="btn primary" data-action="new" aria-label="Neuer Plan" ${!n||!this.loaded||this.busy||this.error?"disabled":""}>${f("plus")}<span class="text">Neuer Plan</span></button></div></header>
      ${this.error?`<div role="alert" class="status error"><span>${c(this.error)}</span><button class="btn small" data-action="refresh">Erneut versuchen</button></div>`:""}
      ${this.message?`<div role="status" class="status"><span>${f("check")} ${c(this.message)}</span>${this.undo?'<button class="btn small" data-action="undo">R\xFCckg\xE4ngig</button>':""}<button class="btn small" aria-label="Meldung schlie\xDFen" data-action="dismiss">${f("close")}</button></div>`:""}
      ${!this.currentHass||!this.loaded&&!this.error?'<div class="loading" role="status">Heizpl\xE4ne werden geladen \u2026<div class="skeleton"></div><div class="skeleton"></div></div>':n?`<div class="layout"><nav class="rooms" aria-label="R\xE4ume"><p class="section-label">Meine R\xE4ume \xB7 ${a.length}</p>${a.map(l=>this.roomHtml(l)).join("")}</nav><main class="main"><label class="field room-select">Raum<select id="room-select" aria-label="Raum ausw\xE4hlen">${a.map(l=>`<option value="${c(l.id)}" ${l.id===n.id?"selected":""}>${c(l.name)}${a.filter(m=>m.name===l.name).length>1?` \xB7 ${c(l.detail)}`:""}</option>`).join("")}</select></label>${this.roomContent(n)}</main></div>`:`<div class="empty-state">${f("home")}<h2>Noch keine Thermostate</h2><p>W\xE4hle in der Kartenkonfiguration die Thermostate aus, die du hier steuern m\xF6chtest.</p></div>`}
    </section>${this.edit?this.editorHtml(this.edit):this.quick?this.quickHtml():this.deletion?this.deleteHtml():""}`;if(o===this.renderedMarkup)return;let d=[],p=this;for(;p;){d.push({element:p,top:p.scrollTop,left:p.scrollLeft});let l=p.getRootNode();p=p.parentElement||(l instanceof ShadowRoot?l.host:null)}s?.close(),this.root.innerHTML=o,this.renderedMarkup=o;let h=this.root.querySelector("dialog");if(h){h.addEventListener("cancel",m=>{m.preventDefault(),this.close()}),h.showModal();let l=this.root.querySelector(".dialog-body");l&&(l.scrollTop=e),t&&[...h.querySelectorAll("[aria-label]")].find(m=>m.getAttribute("aria-label")===t)?.focus({preventScroll:!0})}for(let{element:l,top:m,left:j}of d)l.scrollTop!==m&&(l.scrollTop=m),l.scrollLeft!==j&&(l.scrollLeft=j)}roomHtml(e){return`<button class="room ${e.id===this.room?"active":""}" data-action="room" data-id="${c(e.id)}" aria-current="${e.id===this.room?"true":"false"}"><span class="room-icon">${f(e.state.state!=="off"&&e.state.attributes.hvac_action==="heating"?"heat":"home")}</span><span class="room-copy"><strong>${c(e.name)}</strong><small>${e.state.state!=="off"&&e.state.attributes.hvac_action==="heating"?'<span class="dot"></span>Heizt gerade':c(e.detail)}</small></span><span class="room-temp">${g(e.state.attributes.current_temperature)}\xB0</span></button>`}roomContent(e){let t=this.schedules.filter(h=>b(h).includes(e.id)),s=C(this.hass,this.weekOffset),a=s[this.day],n=t.filter(h=>S(h,a,this.calendar)!=="no"),r=t.filter(h=>v(h,this.hass)),o=r.some(A)?null:U(this.schedules,this.hass,e.id),d=t.filter(h=>S(h,a,this.calendar)==="yes"&&v(h,this.hass)).length>1,p=["unavailable","unknown"].includes(e.state.state);return`<section class="hero"><div class="hero-title"><div class="row" style="margin-bottom:5px"><p class="eyebrow">Raum\xFCbersicht</p></div><h2>${c(e.name)}</h2><small>${c(e.detail)}</small><div class="readings"><div class="reading"><small>Raumtemperatur</small><strong>${g(e.state.attributes.current_temperature)} <span>${c(this.unit())}</span></strong></div><div class="reading"><small>Aktuell eingestellt</small><strong>${e.state.state==="off"?"Aus":`${g(e.state.attributes.temperature)} <span>${c(this.unit())}</span>`}</strong></div></div></div><div style="text-align:right"><span class="pill ${p?"warn":""}">${p?"Nicht erreichbar":e.state.state!=="off"&&e.state.attributes.hvac_action==="heating"?`${f("heat")} Heizt gerade`:e.state.state==="off"?"Heizung aus":r.length?"Heizplan aktiv":"Kein aktiver Plan"}</span><br><button class="btn small" style="margin-top:14px" data-action="quick" ${p||this.busy?"disabled":""}>Heizung steuern</button></div></section>
    <div class="next">${f("clock")}<span>${d?"Mehrere Pl\xE4ne sind gleichzeitig aktiv. Bitte pr\xFCfe die Heizzeiten.":o?`N\xE4chster Heizabschnitt <strong>${o.minutes<1440?`in ${Math.floor(o.minutes/60)?`${Math.floor(o.minutes/60)} Std. `:""}${o.minutes%60} Min.`:`in ${Math.floor(o.minutes/1440)} Tagen`}</strong> \xB7 ${o.off?"Heizung aus":`${g(o.temperature)} ${c(this.unit())}`}`:r.length?"Die n\xE4chste Schaltung wird vom aktiven Heizplan bestimmt.":"Ohne aktiven Heizplan bleibt die eingestellte Temperatur bestehen."}</span></div>
    <div class="between week-head"><div><p class="eyebrow">Deine Woche \xB7 ${z(s[0])}\u2013${z(s[6])}</p><h3>${N[this.day]}, ${z(a)}</h3></div><div class="week-navigation"><button class="btn quiet small" data-action="previous-week" aria-label="Vorherige Woche">\u2039</button><button class="btn quiet small" data-action="today">Heute</button><button class="btn quiet small" data-action="next-week" aria-label="N\xE4chste Woche">\u203A</button></div></div><div class="day-tabs" role="group" aria-label="Wochentag">${u.map((h,l)=>`<button class="day-tab ${l===this.day?"active":""}" data-action="day" data-index="${l}" aria-pressed="${l===this.day}">${M[l]}<small>${z(s[l])}</small>${s[l]===$(this.hass)?'<span class="today"></span>':""}</button>`).join("")}</div>
    <div class="week-grid" aria-label="Wochen\xFCbersicht">${s.map((h,l)=>this.weekColumn(t,h,l)).join("")}</div>
    ${n.length?n.map(h=>this.planHtml(h,S(h,a,this.calendar))).join(""):`<div class="empty-state">${f("sun")}<h3>Kein Heizplan vorhanden</h3><p>F\xFCr ${N[this.day]}, ${z(a)} ist kein Heizplan zugeordnet.</p><button class="btn primary" data-action="new-day">${f("plus")} Heizzeiten festlegen</button></div>`}
    <p class="footnote">Ein pausierter Plan schaltet die Heizung nicht aus. Deine Zeitpl\xE4ne laufen in Home Assistant weiter, auch wenn du diese Ansicht schlie\xDFt.</p>`}weekColumn(e,t,s){let a=e.filter(n=>S(n,t,this.calendar)!=="no");return`<div class="week-column ${t===$(this.hass)?"today-col":""}"><small>${M[s]} \xB7 ${z(t)}</small>${a.length?a.map(n=>{let r=S(n,t,this.calendar),o=v(n,this.hass);return`<div class="week-plan ${o?"":"paused"} ${r==="unknown"?"uncertain":""}"><div class="week-plan-label"><strong>${c(n.name||"Heizplan")}</strong><span>${o?"Aktiv":"Pausiert"}</span>${this.calendarNote(n,r,t)}</div>${w(n)?'<div class="segment empty">Sonderregeln</div>':n.timeslots.map(d=>`<div class="segment ${Number(d.actions[0].service_data?.temperature)>=20?"warm":""}"><span>${c(d.start.slice(0,5))}</span><strong>${_(d)?"Aus":`${g(d.actions[0].service_data?.temperature)}\xB0`}</strong></div>`).join("")}</div>`}).join(""):'<div class="segment empty">Kein Heizplan</div>'}</div>`}calendarNote(e,t,s){return t==="unknown"?'<span class="calendar-note">Zuordnung noch offen</span>':A(e)?`<span class="calendar-note">${this.calendar[s]?.source==="standard"?"Standardwoche":"Arbeitskalender"}</span>`:""}planHtml(e,t="yes"){let s=w(e),a=v(e,this.hass),n=q(this.hass);return`<article class="plan ${a?"":"paused"} ${t==="unknown"?"uncertain":""}"><div class="plan-head"><div><h3>${c(e.name||"Heizplan")}</h3><small>${c(Z(e.weekdays))}</small>${this.calendarNote(e,t,C(this.hass,this.weekOffset)[this.day])}</div><span class="pill ${t==="unknown"?"warn":""}">${a?"Aktiv":"Pausiert"}</span></div><div class="plan-body">${s?`<div class="notice" style="margin:14px">${f("lock")} ${c(s)} Die Einstellungen bleiben erhalten. Bearbeite diesen Plan in deiner bisherigen Scheduler-Oberfl\xE4che.</div>`:e.timeslots.map(r=>{let o=a&&C(this.hass,this.weekOffset)[this.day]===$(this.hass)&&t==="yes"&&k(r.start)<=n.minute&&P(r.stop)>n.minute;return`<div class="period ${o?"active-period":""}">${f(Number(r.actions[0].service_data?.temperature)>=20?"sun":"moon")}<div><strong>${c(r.start.slice(0,5))} \u2013 ${D(P(r.stop))}</strong>${o?"<small>Jetzt im Heizplan</small>":""}</div><div class="period-temp">${c(J(r,this.unit()))}</div></div>`}).join("")}</div><footer class="plan-footer"><button class="toggle" role="switch" aria-checked="${a}" aria-label="Heizplan ${c(e.name||"Heizplan")} aktiv" data-action="toggle" data-id="${c(e.schedule_id)}" ${this.busy?"disabled":""}><span class="switch"></span>${a?"Plan aktiv":"Plan pausiert"}</button><div class="plan-actions"><button class="btn quiet small" data-action="delete" data-id="${c(e.schedule_id)}" aria-label="Heizplan ${c(e.name||"Heizplan")} l\xF6schen" ${this.busy?"disabled":""}>${f("bin")}</button>${s?"":`<button class="btn quiet small" data-action="copy" data-id="${c(e.schedule_id)}" ${this.busy?"disabled":""}>${f("copy")} Kopieren</button><button class="btn small" data-action="edit" data-id="${c(e.schedule_id)}" ${this.busy?"disabled":""}>${f("edit")} Bearbeiten</button>`}</div></footer></article>`}editorHtml(e){let t=e.draft,s=y(this.hass,t.entity);return`<dialog class="sheet" role="dialog" aria-modal="true" aria-labelledby="edit-title"><section class="dialog"><header class="dialog-head"><div><p class="eyebrow">Heizzeiten gestalten</p><h2 id="edit-title">${e.original?"Heizplan bearbeiten":"Neuer Heizplan"}</h2></div><button class="btn quiet" data-action="close" aria-label="Editor schlie\xDFen" ${this.busy?"disabled":""}>${f("close")}</button></header><div class="dialog-body" ${this.busy?"inert":""}><div class="two-fields"><label class="field">Name des Plans<input class="input" data-field="name" value="${c(t.name)}" maxlength="80" autocomplete="off"></label><label class="field">Thermostat<select data-field="entity" ${e.original?"disabled":""}>${this.rooms().map(a=>`<option value="${c(a.id)}" ${a.id===t.entity?"selected":""}>${c(a.name)} \xB7 ${c(a.detail)}</option>`).join("")}</select></label></div><h3>F\xFCr welche Tage?</h3><label class="field" style="margin-top:10px">Tagesauswahl<select data-field="calendar"><option value="days" ${t.weekdays.some(a=>["workday","weekend"].includes(a))?"":"selected"}>Wochentage selbst w\xE4hlen</option><option value="workday" ${t.weekdays.includes("workday")?"selected":""}>Arbeitstage nach Arbeitskalender</option><option value="weekend" ${t.weekdays.includes("weekend")?"selected":""}>Freie Tage nach Arbeitskalender</option></select></label>${t.weekdays.some(a=>["workday","weekend"].includes(a))?'<p class="helper">Feiertage und freie Tage bestimmt dein Arbeitskalender in Home Assistant.</p>':""}<div class="day-choice">${u.map((a,n)=>`<label><input type="checkbox" data-day="${a}" ${t.weekdays.includes(a)?"checked":""} ${t.weekdays.some(r=>["workday","weekend"].includes(r))?"disabled":""}><span>${M[n]}</span></label>`).join("")}</div><div class="presets"><button class="preset" data-action="preset" data-preset="work">Mo\u2013Fr</button><button class="preset" data-action="preset" data-preset="weekend">Sa\u2013So</button><button class="preset" data-action="preset" data-preset="all">Jeden Tag</button></div><div class="between"><h3>Wie warm soll es sein?</h3><small>${t.periods.length} Abschnitte</small></div><p class="helper">Jede Einstellung gilt ab der angegebenen Uhrzeit bis zum n\xE4chsten Abschnitt.</p>${t.periods.map((a,n)=>this.periodHtml(a,n,t)).join("")}<button class="btn quiet" style="margin-top:12px" data-action="add-period" ${t.periods.length>=24?"disabled":""}>${f("plus")} Abschnitt hinzuf\xFCgen</button><div class="notice">${e.original?"\xC4nderungen an einem aktiven Plan k\xF6nnen sofort die Temperatur anpassen.":"Mit dem Speichern wird dieser Plan aktiviert. Die passende Einstellung wird sofort angewendet."} Die letzte Einstellung gilt bis 24:00 Uhr.</div><div class="inline-error" role="alert" id="edit-error">${c(e.error)}</div></div><footer class="dialog-footer">${e.discard?'<span>\xC4nderungen verwerfen?</span><div class="actions"><button class="btn" data-action="keep">Weiter bearbeiten</button><button class="btn primary" data-action="discard">Verwerfen</button></div>':`<div class="actions"><button class="btn" data-action="close" ${this.busy?"disabled":""}>Abbrechen</button><button class="btn primary" data-action="save" ${this.busy?"disabled":""}>${this.busy?"Wird gespeichert \u2026":"Heizplan speichern"}</button></div>`}</footer></section></dialog>`}periodHtml(e,t,s){let a=y(this.hass,s.entity),n=e.mode==="off",r=x(this.hass,s.entity,"off")&&x(this.hass,s.entity,"heat");return`<div class="edit-period"><label class="period-time">Ab Uhrzeit<input type="time" value="${D(e.start)}" step="60" data-start="${t}" aria-label="Beginn Abschnitt ${t+1}" ${t===0?"disabled":""}></label><div class="period-settings"><label class="period-mode">Einstellung<select data-period-mode="${t}" aria-label="Betrieb Abschnitt ${t+1}"><option value="heat" ${n?"":"selected"}>Heizen</option><option value="off" ${n?"selected":""} ${r?"":"disabled"}>Heizung aus${r?"":" (nicht unterst\xFCtzt)"}</option></select></label>${n?'<p class="off-period">Heizung ausgeschaltet</p>':`<div class="temperature-control"><p class="stepper-label">Temperatur \xB7 ${c(this.unit())}</p><div class="stepper"><button data-action="step" data-index="${t}" data-delta="-1" aria-label="Abschnitt ${t+1} k\xE4lter">\u2212</button><input type="number" value="${e.temperature}" min="${a.min}" max="${a.max}" step="${a.step}" data-temperature="${t}" aria-label="Temperatur Abschnitt ${t+1}"><button data-action="step" data-index="${t}" data-delta="1" aria-label="Abschnitt ${t+1} w\xE4rmer">+</button></div></div>`}</div><button class="delete" data-action="remove-period" data-index="${t}" aria-label="Abschnitt ${t+1} entfernen" ${t===0?"disabled":""}>${f("bin")}</button></div>`}deleteHtml(){return`<dialog class="sheet" role="dialog" aria-modal="true" aria-labelledby="delete-title"><section class="dialog" style="max-width:460px;height:auto"><header class="dialog-head"><h2 id="delete-title">Heizplan l\xF6schen?</h2></header><div class="dialog-body"><p><strong>${c(this.deletion.schedule.name||"Heizplan")}</strong> wird dauerhaft gel\xF6scht. Die aktuell eingestellte Raumtemperatur bleibt bestehen.</p><p class="helper">Du kannst den Plan stattdessen pausieren, wenn du ihn sp\xE4ter wieder verwenden m\xF6chtest.</p><div role="alert" class="inline-error">${c(this.deletion.error)}</div></div><footer class="dialog-footer"><button class="btn" data-action="close" ${this.busy?"disabled":""}>Behalten</button><button class="btn primary" data-action="confirm-delete" ${this.busy?"disabled":""}>${this.busy?"Wird gel\xF6scht \u2026":"Endg\xFCltig l\xF6schen"}</button></footer></section></dialog>`}quickHtml(){let e=this.selected(),t=y(this.hass,e.id),s=this.quick.mode==="off",a=this.schedules.some(n=>b(n).includes(e.id)&&v(n,this.hass));return`<dialog class="sheet" role="dialog" aria-modal="true" aria-labelledby="quick-title"><section class="dialog quick-dialog"><header class="dialog-head"><div><p class="eyebrow">${c(e.name)}</p><h2 id="quick-title">Heizung steuern</h2></div><button class="btn quiet" data-action="close" aria-label="Schlie\xDFen" ${this.busy?"disabled":""}>${f("close")}</button></header><div class="dialog-body" ${this.busy?"inert":""}><div class="mode-buttons" role="group" aria-label="Heizungsbetrieb"><button class="btn ${s?"":"primary"}" data-action="quick-mode" data-mode="heat" aria-pressed="${!s}" ${e.state.state==="off"&&!x(this.hass,e.id,"heat")?"disabled":""}>Heizen</button><button class="btn ${s?"primary":""}" data-action="quick-mode" data-mode="off" aria-pressed="${s}" ${x(this.hass,e.id,"off")?"":"disabled"}>Heizung aus</button></div>${s?'<p class="off-period">Die Heizung wird ausgeschaltet.</p>':`<div class="stepper quick-stepper"><button data-action="quick-step" data-delta="-1" aria-label="K\xE4lter">\u2212</button><input type="number" data-field="quick" value="${this.quick.value}" min="${t.min}" max="${t.max}" step="${t.step}" aria-label="Zieltemperatur"><button data-action="quick-step" data-delta="1" aria-label="W\xE4rmer">+</button></div>`}<p class="helper">${a?"Ein aktiver Heizplan kann die Heizung sp\xE4ter wieder einschalten oder die Temperatur \xE4ndern.":"Die Einstellung bleibt bestehen, bis du sie \xE4nderst oder eine andere Steuerung eingreift."} Der Heizplan wird dabei nicht bearbeitet.</p><div class="inline-error" role="alert">${c(this.quick.error)}</div></div><footer class="dialog-footer"><button class="btn" data-action="close" ${this.busy?"disabled":""}>Abbrechen</button><button class="btn primary" data-action="quick-save" ${this.busy?"disabled":""}>${this.busy?"Wird eingestellt \u2026":s?"Heizung ausschalten":"Temperatur einstellen"}</button></footer></section></dialog>`}focusDialog(){queueMicrotask(()=>this.root.querySelector(".dialog input:not(:disabled),.dialog button:not(:disabled)")?.focus())}focusTrigger(){queueMicrotask(()=>this.root.querySelector('[data-action="edit"], [data-action="new"]')?.focus())}openDraft(e,t){this.edit={draft:e,original:t,initial:JSON.stringify(e),error:"",discard:!1},this.render(),this.focusDialog()}input(e){let t=e.target;if(this.busy||(this.quick&&t.dataset.field==="quick"&&(this.quick.value=t.valueAsNumber),!this.edit))return;let s=this.edit.draft;t.dataset.field==="name"&&(s.name=t.value),t.dataset.temperature!==void 0&&(s.periods[Number(t.dataset.temperature)].temperature=t.valueAsNumber),t.dataset.start!==void 0&&(s.periods[Number(t.dataset.start)].start=k(t.value))}change(e){let t=e.target;if(!this.busy){if(t.id==="room-select"){this.room=t.value,this.render();return}if(this.edit){if(t.dataset.day){let s=this.edit.draft.weekdays;this.edit.draft.weekdays=u.filter(a=>a===t.dataset.day?t.checked:s.includes(a))}if(t.dataset.periodMode!==void 0){let s=this.edit.draft.periods[Number(t.dataset.periodMode)];s.mode=t.value==="off"?"off":"heat",this.render()}t.dataset.field==="calendar"&&(this.edit.draft.weekdays=t.value==="days"?u.slice(0,5):[t.value],this.render()),t.dataset.field==="entity"&&(this.edit.draft.entity=t.value,this.render())}}}key(e){if(!(!this.edit&&!this.quick&&!this.deletion)&&(e.key==="Escape"&&(e.preventDefault(),this.close()),e.key==="Tab")){let t=[...this.root.querySelectorAll(".dialog button:not(:disabled),.dialog input:not(:disabled),.dialog select:not(:disabled)")],s=t[0],a=t.at(-1);e.shiftKey&&this.root.activeElement===s?(e.preventDefault(),a?.focus()):!e.shiftKey&&this.root.activeElement===a&&(e.preventDefault(),s?.focus())}}close(){if(!this.busy){if(this.edit&&JSON.stringify(this.edit.draft)!==this.edit.initial){this.edit.discard=!0,this.render(),this.focusDialog();return}this.edit=void 0,this.quick=void 0,this.deletion=void 0,this.render(),this.focusTrigger()}}async handleClick(e){let t=e.target.closest("[data-action]");if(!t||t.hasAttribute("disabled")||this.busy)return;let s=t.dataset.action,a=t.dataset.id,n=Number(t.dataset.index);if(s==="room")this.room=a,this.render();else if(s==="day")this.day=n,this.render();else if(s==="today")this.weekOffset=0,this.refreshCalendar(),this.day=q(this.hass).day,this.render();else if(s==="previous-week"||s==="next-week")this.weekOffset+=s==="next-week"?1:-1,this.refreshCalendar(),this.render();else if(s==="refresh")await this.refresh(),await this.refreshCalendar(!0);else if(s==="dismiss")this.message="",this.render();else if(s==="new"||s==="new-day"){let r=this.selected();if(r){let o=V(r.id,this.hass);o.name=`${r.name} \xB7 ${s==="new-day"?N[this.day]:"Wohlf\xFChlzeiten"}`,s==="new-day"&&(o.weekdays=[u[this.day]]),this.openDraft(o)}}else if(s==="edit"||s==="copy"){this.busy=!0;try{let r=await this.api.item(a),o=w(r);if(o)throw new Error(o);let d=T(r);s==="copy"?(d.name=`${d.name} \xB7 Kopie`.slice(0,80),this.openDraft(d)):this.openDraft(d,r)}catch(r){this.error=this.errorText(r)}finally{this.busy=!1,this.render(),this.edit&&this.focusDialog()}}else if(s==="close")this.close();else if(s==="discard")this.edit=void 0,this.render(),this.focusTrigger();else if(s==="keep"&&this.edit)this.edit.discard=!1,this.render(),this.focusDialog();else if(s==="preset"&&this.edit)this.edit.draft.weekdays=t.dataset.preset==="work"?u.slice(0,5):t.dataset.preset==="weekend"?u.slice(5):[...u],this.render();else if(s==="add-period"&&this.edit)this.edit.draft.periods=G(this.edit.draft.periods),this.render();else if(s==="remove-period"&&this.edit&&n>0)this.edit.draft.periods.splice(n,1),this.render();else if(s==="step"&&this.edit){let r=y(this.hass,this.edit.draft.entity),o=this.edit.draft.periods[n];o.temperature=Number(Math.max(r.min,Math.min(r.max,(Number.isFinite(o.temperature)?o.temperature:r.min)+Number(t.dataset.delta)*r.step)).toFixed(3)),this.render()}else if(s==="save"&&this.edit){let r=this.edit,o=R(r.draft,this.hass);if(o){r.error=o,this.render();return}this.busy=!0,this.render();try{this.schedules=await this.api.save(r.draft,r.original),this.refreshCalendar();let d=this.schedules.find(p=>p.schedule_id===r.original?.schedule_id);this.undo=r.original&&d?{before:structuredClone(r.original),after:structuredClone(d)}:void 0,this.message="Dein Heizplan wurde gespeichert.",this.error="",this.edit=void 0,!r.draft.weekdays.includes(u[this.day])&&!r.draft.weekdays.some(p=>["workday","weekend"].includes(p))&&(this.day=Math.max(0,u.indexOf(r.draft.weekdays[0]))),this.room=r.draft.entity}catch(d){r.error=this.errorText(d)}finally{this.busy=!1,this.render(),this.edit||this.focusTrigger()}}else if(s==="toggle"){let r=this.schedules.find(o=>o.schedule_id===a);if(!r)return;this.busy=!0,this.render();try{await this.api.toggle(r,!v(r,this.hass)),this.message=v(r,this.hass)?"Heizplan wird pausiert. Die Heizung bleibt auf ihrer bisherigen Einstellung.":"Heizplan wird aktiviert.",this.undo=void 0,await this.refresh()}catch(o){this.error=this.errorText(o)}finally{this.busy=!1,this.render()}}else if(s==="undo"&&this.undo){this.busy=!0,this.render();try{this.schedules=await this.api.save(T(this.undo.before),this.undo.after),this.refreshCalendar(),this.message="Die letzte \xC4nderung wurde r\xFCckg\xE4ngig gemacht.",this.undo=void 0}catch(r){this.error=this.errorText(r)}finally{this.busy=!1,this.render()}}else if(s==="delete"){let r=this.schedules.find(o=>o.schedule_id===a);r&&(this.deletion={schedule:structuredClone(r),error:""},this.render(),this.focusDialog())}else if(s==="confirm-delete"&&this.deletion){this.busy=!0,this.render();try{this.schedules=await this.api.remove(this.deletion.schedule),this.deletion=void 0,this.undo=void 0,this.message="Der Heizplan wurde gel\xF6scht."}catch(r){this.deletion.error=this.errorText(r)}finally{this.busy=!1,this.render(),this.deletion||this.focusTrigger()}}else if(s==="quick"){let r=this.selected();this.quick={value:Number(r.state.attributes.temperature)||20,mode:r.state.state==="off"?"off":"heat",error:""},this.render(),this.focusDialog()}else if(s==="quick-mode"&&this.quick)this.quick.mode=t.dataset.mode==="off"?"off":"heat",this.render();else if(s==="quick-step"&&this.quick){let r=y(this.hass,this.room);this.quick.value=Number(Math.max(r.min,Math.min(r.max,(this.quick.value||r.min)+Number(t.dataset.delta)*r.step)).toFixed(3)),this.render()}else if(s==="quick-save"&&this.quick){let r=y(this.hass,this.room),o=this.quick.value;if(this.quick.mode==="heat"&&(!Number.isFinite(o)||o<r.min||o>r.max||Math.abs(o/r.step-Math.round(o/r.step))>1e-5)){this.quick.error=`Bitte w\xE4hle ${g(r.min)} bis ${g(r.max)} ${this.unit()} in Schritten von ${g(r.step)}.`,this.render();return}this.busy=!0,this.render();try{if(this.quick.mode==="off"){if(!x(this.hass,this.room,"off"))throw new Error("Dieses Thermostat unterst\xFCtzt den Aus-Modus nicht.");await this.hass.callService("climate","set_hvac_mode",{entity_id:this.room,hvac_mode:"off"}),this.message="Der Ausschaltbefehl wurde an das Thermostat gesendet."}else{if(this.hass.states[this.room]?.state==="off"&&!x(this.hass,this.room,"heat"))throw new Error("Dieses Thermostat unterst\xFCtzt keinen direkten Heizmodus.");await this.hass.callService("climate","set_temperature",{entity_id:this.room,temperature:o,...x(this.hass,this.room,"heat")?{hvac_mode:"heat"}:{}}),this.message="Die gew\xFCnschte Temperatur wurde an das Thermostat gesendet."}this.quick=void 0}catch(d){this.quick.error=this.errorText(d)}finally{this.busy=!1,this.render()}}}},K=class extends HTMLElement{root=this.attachShadow({mode:"open"});config={type:"custom:heatingplan-card"};state;roomSignature="";constructor(){super(),this.root.addEventListener("change",e=>this.handleChange(e))}setConfig(e){let t=e.title!==this.config.title;this.config={...e,...e.entities?{entities:[...e.entities]}:{}},this.update(t)}set hass(e){this.state=e,this.update()}connectedCallback(){this.update(!0)}update(e=!1){this.root.querySelector("section")||(this.root.innerHTML='<style>:host{display:block;font:inherit}label{display:block;margin:12px 0}input[type=text]{display:block;width:100%;box-sizing:border-box;padding:12px;border:1px solid var(--divider-color,#ccc);border-radius:8px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#222)}.rooms{max-height:300px;overflow:auto}p{color:var(--secondary-text-color,#666);font-size:13px}input[type=checkbox]{margin-right:10px}</style><section><label>Titel<input type="text" id="title"></label><label><input type="checkbox" id="all">Alle Thermostate anzeigen</label><div class="rooms"></div><p>W\xE4hle vorzugsweise die Better-Thermostat-Entit\xE4ten aus, damit jeder Raum nur einmal erscheint. Die Scheduler-Integration muss installiert sein.</p></section>',e=!0),e&&(this.root.querySelector("#title").value=this.config.title||"Heizplan");let t=this.state?L(this.state):[],s=JSON.stringify(t.map(n=>[n.id,n.name,n.detail])),a=this.root.querySelector(".rooms");if(s!==this.roomSignature){let n=a.scrollTop,r=this.root.activeElement?.dataset.id,o=this.ownerDocument.createDocumentFragment();for(let d of t){let p=this.ownerDocument.createElement("label"),h=this.ownerDocument.createElement("input");h.type="checkbox",h.dataset.id=d.id,p.append(h,this.ownerDocument.createTextNode(`${d.name} \xB7 ${d.detail}`)),o.append(p)}a.replaceChildren(o),this.roomSignature=s,this.syncSelection(),r&&[...a.querySelectorAll("input")].find(d=>d.dataset.id===r)?.focus({preventScroll:!0}),a.scrollTop=n}else this.syncSelection()}syncSelection(){let e=this.config.entities===void 0;this.root.querySelector("#all").checked=e;for(let t of this.root.querySelectorAll("[data-id]"))t.checked=e||this.config.entities.includes(t.dataset.id),t.disabled=e}handleChange(e){let t=e.target;if(t.id==="title")this.config.title=t.value;else if(t.id==="all")t.checked?delete this.config.entities:this.config.entities=this.state?L(this.state).map(s=>s.id):[];else if(t.dataset.id){let s=new Set(this.config.entities||[]);t.checked?s.add(t.dataset.id):s.delete(t.dataset.id),this.config.entities=[...s]}else return;this.syncSelection(),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:{...this.config,...this.config.entities?{entities:[...this.config.entities]}:{}}},bubbles:!0,composed:!0}))}};customElements.define("heatingplan-card",B);customElements.define("heatingplan-card-editor",K);var se=window;se.customCards??=[];se.customCards.push({type:"heatingplan-card",name:"Heating Plan Card",description:"Heizpl\xE4ne einfach gestalten \u2013 f\xFCr Handy und Desktop.",preview:!0});console.info("Heating Plan Card 1.2.0");})();
