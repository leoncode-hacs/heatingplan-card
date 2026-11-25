/*! Heating Plan Card v1.4.2 | Copyright 2026 Heating Plan Card contributors | SPDX-License-Identifier: GPL-3.0-only | Source: https://github.com/leoncode-hacs/heatingplan-card */
"use strict";(()=>{var m=["mon","tue","wed","thu","fri","sat","sun"],Y=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"],H=["Mo","Di","Mi","Do","Fr","Sa","So"];function _(a){let e=/^(\d{2}):(\d{2})(?::00)?$/.exec(a);if(!e)return NaN;let t=Number(e[1]),i=Number(e[2]);return t===24&&i===0?1440:t<24&&i<60?t*60+i:NaN}function F(a){return a==="00:00:00"||a==="00:00"||a==="23:59:59"?1440:_(a)}function k(a){return`${String(Math.floor(a/60)).padStart(2,"0")}:${String(a%60).padStart(2,"0")}`}function v(a){return typeof a=="number"&&Number.isFinite(a)?a.toLocaleString("de-DE",{maximumFractionDigits:1}):"\u2013"}function A(a,e){let i=(e??Object.keys(a.states).filter(s=>s.startsWith("climate."))).map(s=>{let n=a.states[s];if(!n||!s.startsWith("climate."))return null;let r=a.entities?.[s],o=r?.area_id||(r?.device_id?a.devices?.[r.device_id]?.area_id:void 0),d=o?a.areas?.[o]?.name:void 0,h=String(n.attributes.friendly_name||s.slice(8).replaceAll("_"," "));return{id:s,name:d||h,detail:d&&d!==h?h:s,state:n}}).filter(s=>s!==null);for(let s of i)i.filter(n=>n.name===s.name).length>1&&(s.detail=`${s.detail} \xB7 ${s.id}`);return i.sort((s,n)=>s.name.localeCompare(n.name,"de"))}function x(a){return[...new Set((a.timeslots||[]).flatMap(e=>(e.actions||[]).map(t=>t.entity_id)).filter(e=>typeof e=="string"))]}function J(a){return a.includes("daily")||m.every(e=>a.includes(e))?"Jeden Tag":a.length===5&&m.slice(0,5).every(e=>a.includes(e))?"Montag bis Freitag":a.length===2&&a.includes("sat")&&a.includes("sun")?"Wochenende":a.includes("workday")?"Arbeitstage (Arbeitskalender)":a.includes("weekend")?"Freie Tage (Arbeitskalender)":m.filter(e=>a.includes(e)).map(e=>H[m.indexOf(e)]).join(", ")}function ke(a,e){return a.weekdays.includes("daily")||a.weekdays.includes(m[e])}function w(a,e){let t=e.states[a.entity_id]?.state;return t!==void 0?t==="on"||t==="triggered":a.enabled!==!1}function T(a,e){let t=a.states[e]?.attributes||{};return{min:Number.isFinite(t.min_temp)?t.min_temp:5,max:Number.isFinite(t.max_temp)?t.max_temp:30,step:Number.isFinite(t.target_temp_step)&&t.target_temp_step>0?t.target_temp_step:.5}}function z(a,e,t){return a.states[e]?.attributes.hvac_modes?.includes(t)===!0}function q(a){let e=a.actions[0];return e?.service==="climate.turn_off"||e?.service==="climate.set_hvac_mode"&&e.service_data?.hvac_mode==="off"}function G(a,e){return q(a)?"Aus":`${v(a.actions[0]?.service_data?.temperature)} ${e}`}function y(a){if(x(a).length!==1||!x(a)[0]?.startsWith("climate."))return"Dieser Plan steuert mehrere Ger\xE4te oder andere Aktionen.";if(a.repeat_type&&a.repeat_type!=="repeat")return"Dieser Plan hat eine besondere Wiederholungsregel.";if(a.start_date||a.end_date)return"Dieser Plan gilt nur in einem bestimmten Zeitraum.";if(!a.weekdays.length||a.weekdays.some(t=>!m.includes(t)&&!["daily","workday","weekend"].includes(t))||a.weekdays.some(t=>t==="workday"||t==="weekend")&&a.weekdays.length!==1)return"Dieser Plan kombiniert besondere Kalenderregeln.";if(!a.timeslots.length)return"Dieser Plan enth\xE4lt keine Heizzeiten.";let e=0;for(let t of a.timeslots){let i=t.actions[0];if(t.conditions?.length||t.track_conditions)return"Dieser Plan enth\xE4lt zus\xE4tzliche Bedingungen.";let s=i?.service_data||{},n=i?.service==="climate.turn_off"&&Object.keys(s).length===0||i?.service==="climate.set_hvac_mode"&&s.hvac_mode==="off"&&Object.keys(s).length===1,r=i?.service==="climate.set_temperature"&&Number.isFinite(s.temperature)&&Object.keys(s).every(h=>h==="temperature"||h==="hvac_mode"&&s.hvac_mode==="heat");if(t.actions.length!==1||!n&&!r)return"Dieser Plan enth\xE4lt zus\xE4tzliche Einstellungen oder Aktionen.";let o=_(t.start),d=t.stop?F(t.stop):NaN;if(o!==e||!Number.isFinite(d)||d<=o)return"Dieser Plan verwendet einzelne Schaltzeiten oder Zeitl\xFCcken.";e=d}return e===1440?null:"Dieser Plan deckt nicht den ganzen Tag ab."}function P(a){if(y(a))throw new Error("Dieser Plan ist nur zur Ansicht verf\xFCgbar.");return{name:a.name||"",entity:x(a)[0],weekdays:a.weekdays.includes("daily")?[...m]:[...a.weekdays],periods:a.timeslots.map(e=>({start:_(e.start),temperature:q(e)?20:Number(e.actions[0].service_data?.temperature),...q(e)?{mode:"off"}:e.actions[0].service_data?.hvac_mode==="heat"?{mode:"heat"}:{}}))}}function oe(a,e){let t=T(e,a),i=s=>{let n=e.config?.unit_system?.temperature==="\xB0F"?s*1.8+32:s;return Math.min(t.max,Math.max(t.min,Math.round(n/t.step)*t.step))};return{name:"",entity:a,weekdays:m.slice(0,5),periods:[{start:0,temperature:i(17)},{start:390,temperature:i(21)},{start:540,temperature:i(18)},{start:1020,temperature:i(21)},{start:1320,temperature:i(17)}]}}function $e(a,e){return!!e&&a.name.trim()!==(e.name||"").trim()}function I(a,e,t){if(!e.states[a.entity]||!a.entity.startsWith("climate."))return"Bitte w\xE4hle ein vorhandenes Thermostat.";if($e(a,t))return"Der Name eines bestehenden Plans kann nicht ge\xE4ndert werden. Kopiere den Plan, um ihn unter neuem Namen anzulegen.";if(a.name.length>80)return"Bitte gib einen Namen mit h\xF6chstens 80 Zeichen ein.";if(!a.weekdays.length||new Set(a.weekdays).size!==a.weekdays.length||a.weekdays.some(n=>!m.includes(n)&&!["workday","weekend"].includes(n))||a.weekdays.some(n=>n==="workday"||n==="weekend")&&a.weekdays.length!==1)return"Bitte w\xE4hle mindestens einen Wochentag.";if(!a.periods.length||a.periods[0].start!==0||a.periods.length>24)return"Der Tag muss um 00:00 beginnen und darf h\xF6chstens 24 Abschnitte enthalten.";let i=T(e,a.entity),s=a.periods.some(n=>n.mode==="off");if(s&&!z(e,a.entity,"off"))return"Dieses Thermostat unterst\xFCtzt den Aus-Modus nicht.";if((a.periods.some(n=>n.mode==="heat")||s&&a.periods.some(n=>n.mode!=="off"))&&!z(e,a.entity,"heat"))return"Dieses Thermostat kann nicht automatisch in den Heizmodus zur\xFCckkehren.";for(let n=0;n<a.periods.length;n++){let r=a.periods[n];if(!Number.isInteger(r.start)||r.start<0||r.start>=1440||n>0&&r.start<=a.periods[n-1].start)return"Die Uhrzeiten m\xFCssen in aufsteigender Reihenfolge liegen und d\xFCrfen sich nicht wiederholen.";if(r.mode&&r.mode!=="heat"&&r.mode!=="off")return"Bitte w\xE4hle Heizen oder Aus.";if(r.mode!=="off"){if(!Number.isFinite(r.temperature)||r.temperature<i.min||r.temperature>i.max)return`Bitte w\xE4hle Temperaturen zwischen ${v(i.min)} und ${v(i.max)} \xB0C.`;if(Math.abs(r.temperature/i.step-Math.round(r.temperature/i.step))>1e-5)return`Dieses Thermostat unterst\xFCtzt Schritte von ${v(i.step)} \xB0C.`}}return null}function de(a,e){return{...e||!a.name.trim()?{}:{name:a.name.trim()},weekdays:[...a.weekdays],repeat_type:e?.repeat_type||"repeat",tags:e?.tags||["heatingplan-card"],timeslots:a.periods.map((t,i)=>({start:`${k(t.start)}:00`,stop:a.periods[i+1]?`${k(a.periods[i+1].start)}:00`:"00:00:00",actions:[t.mode==="off"?{entity_id:a.entity,service:"climate.set_hvac_mode",service_data:{hvac_mode:"off"}}:{entity_id:a.entity,service:"climate.set_temperature",service_data:{temperature:t.temperature,...t.mode==="heat"||a.periods.some(s=>s.mode==="off")?{hvac_mode:"heat"}:{}}}]})),...e?{schedule_id:e.schedule_id}:{}}}function R(a){return JSON.stringify([a.name,a.weekdays,a.timeslots,a.repeat_type,a.start_date,a.end_date,a.tags])}function X(a,e,t,i){let s=(n,r)=>n.length===1&&n[0]==="workday"&&r.length===1&&r[0]==="weekend"||r.length===1&&r[0]==="workday"&&n.length===1&&n[0]==="weekend"?!1:[...n,...r].some(o=>["workday","weekend","daily"].includes(o))?!0:n.some(o=>r.includes(o));return e.filter(n=>n.schedule_id!==i&&x(n).includes(a.entity)&&w(n,t)&&s(a.weekdays,n.weekdays))}function D(a,e=new Date){let t=new Intl.DateTimeFormat("en-GB",{timeZone:a.config?.time_zone,weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(e),i=s=>t.find(n=>n.type===s)?.value||"";return{day:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(i("weekday")),minute:Number(i("hour"))*60+Number(i("minute"))}}function Q(a,e,t){let i=D(e),s;for(let n=0;n<=7;n++)for(let r of a)if(!(!w(r,e)||!x(r).includes(t)||y(r)||!ke(r,(i.day+n)%7)))for(let o of r.timeslots){let d=n*1440+_(o.start)-i.minute;d>0&&(!s||d<s.minutes)&&(s={minutes:d,temperature:Number(o.actions[0].service_data?.temperature),off:q(o)})}return s}function le(a){let e=0,t=0;if(a.forEach((s,n)=>{let r=(a[n+1]?.start??1440)-s.start;r>t&&(t=r,e=n)}),t<30)return a;let i=structuredClone(a);return i.splice(e+1,0,{start:Math.floor((a[e].start+t/2)/15)*15,temperature:a[e].temperature,...a[e].mode?{mode:a[e].mode}:{}}),i}function pe(a,e){let t=a[e];if(!t)return a;let i=a[e+1]?.start??1440,s=Math.ceil((t.start+(i-t.start)/2)/15)*15;if(s<=t.start||s>=i)return a;let n=structuredClone(a);return n.splice(e+1,0,{start:s,temperature:t.temperature,...t.mode?{mode:t.mode}:{}}),n}function ce(a){let e=t=>a.length===t.length&&t.every(i=>a.includes(i));return e(["workday"])?"workday":e(["weekend"])?"free":e(m.slice(0,5))?"work":e(m.slice(5))?"weekend":e(m)?"all":"custom"}function he(a,e){if(a==="workday")return["workday"];if(a==="free")return["weekend"];if(a==="work")return m.slice(0,5);if(a==="weekend")return m.slice(5);if(a==="all")return[...m];let t=e.filter(i=>m.includes(i));return t.length?t:m.slice(0,5)}function ue(a,e,t=[]){let i=new Map,s=n=>{typeof n=="number"&&Number.isFinite(n)&&i.set(n,(i.get(n)||0)+1)};for(let n of a)if(x(n).includes(e))for(let r of n.timeslots)q(r)||s(r.actions[0]?.service_data?.temperature);for(let n of t)n.mode!=="off"&&s(n.temperature);return[...i.entries()].sort((n,r)=>r[1]-n[1]||n[0]-r[0]).slice(0,3).map(([n])=>n).sort((n,r)=>n-r)}function se(a){if(a.includes("workday"))return"Arbeitstage";if(a.includes("weekend"))return"Freie Tage";let e=m.filter(s=>a.includes("daily")||a.includes(s));if(e.length===7)return"T\xE4glich";if(!e.length)return"Ohne Tage";let t=e.map(s=>m.indexOf(s));return t.length===2&&t[0]===5&&t[1]===6?"Wochenende":t.every((s,n)=>n===0||s===t[n-1]+1)&&t.length>2?`${H[t[0]]}\u2013${H[t[t.length-1]]}`:t.map(s=>H[s]).join(", ")}function O(a,e){return e?`${e} \xB7 ${se(a)}`:`Heizplan \xB7 ${se(a)}`}var B="binary_sensor.workday_sensor";function S(a,e=new Date){let t=new Intl.DateTimeFormat("en-CA",{timeZone:a.config?.time_zone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(e),i=s=>t.find(n=>n.type===s).value;return`${i("year")}-${i("month")}-${i("day")}`}function L(a,e){let t=new Date(`${a}T12:00:00Z`);return t.setUTCDate(t.getUTCDate()+e),t.toISOString().slice(0,10)}function K(a){return(new Date(`${a}T12:00:00Z`).getUTCDay()+6)%7}function j(a,e=0,t=new Date){let i=S(a,t),s=L(i,-K(i)+e*7);return m.map((n,r)=>L(s,r))}function E(a){return`${a.slice(8,10)}.${a.slice(5,7)}.`}function me(a){let e=new Date(`${L(a,3-K(a))}T12:00:00Z`),t=e.getUTCFullYear(),i=new Date(`${t}-01-01T12:00:00Z`);return{year:t,week:Math.ceil(((e.getTime()-i.getTime())/864e5+1)/7)}}function N(a){return a.weekdays.some(e=>e==="workday"||e==="weekend")}function M(a,e,t){if(a.start_date&&e<a.start_date||a.end_date&&e>a.end_date)return"no";let i=a.weekdays;if(!i.length||i.includes("daily"))return"yes";if(N(a)){if(i.length!==1)return"unknown";let s=t[e]?.workday;return typeof s!="boolean"?"unknown":(i[0]==="workday"?s:!s)?"yes":"no"}return i.includes(m[K(e)])?"yes":i.some(s=>!m.includes(s))?"unknown":"no"}function fe(a,e){let t=a.states[B];return JSON.stringify([e,S(a),a.config?.time_zone,t?.state,t?.attributes])}async function ge(a,e,t=8e3){let i=a.states[B],s=S(a),n=await Promise.all(e.map(async r=>{if(!i)return[r,{workday:K(r)<5,source:"standard"}];if(r===s&&(i.state==="on"||i.state==="off"))return[r,{workday:i.state==="on",source:"sensor"}];let o;try{let d=a.callWS({type:"call_service",domain:"workday",service:"check_date",service_data:{check_date:r},target:{entity_id:B},return_response:!0}),u=(await Promise.race([d,new Promise((p,c)=>{o=setTimeout(()=>c(new Error("Calendar timeout")),t)})]))?.response?.[B]?.workday;if(typeof u=="boolean")return[r,{workday:u,source:"calendar"}]}catch{}finally{o&&clearTimeout(o)}return[r,{workday:null,source:"unknown"}]}));return Object.fromEntries(n)}function Z(a,e=new Date){let t=S(a,e);return Array.from({length:8},(i,s)=>L(t,s))}function be(a,e,t,i,s=new Date){let n=Z(t,s),r=D(t,s).minute;return a.map(o=>{let d=e.filter(b=>x(b).includes(o.id)),h=d.filter(b=>w(b,t)),u=d.some(b=>["unknown","unavailable"].includes(t.states[b.entity_id]?.state)),p=d.filter(b=>!w(b,t)&&!["unknown","unavailable"].includes(t.states[b.entity_id]?.state)).length,c={room:o,paused:p,unavailable:["unknown","unavailable"].includes(o.state.state)};if(u)return{...c,status:"unknown"};if(!h.length)return{...c,status:d.length?"paused":"none"};let g=1/0,$=[];for(let b of h)for(let[W,ie]of n.entries()){let re=M(b,ie,i);if(re!=="no"){if(y(b)){g=Math.min(g,W*1440);continue}for(let ae of b.timeslots){let ne=_(ae.start),V=W*1440+ne;V<=r||(re==="unknown"?g=Math.min(g,V):$.push({date:ie,minute:ne,order:V,plan:b,slot:ae}))}}}$.sort((b,W)=>b.order-W.order);let C=$[0];if(g<=(C?.order??1/0)&&Number.isFinite(g))return{...c,status:"unknown"};if(!C)return{...c,status:"later"};let ye=h.filter(b=>M(b,C.date,i)==="yes").length>1;return{...c,next:C,status:ye?"conflict":"next"}}).sort((o,d)=>(o.next?.order??1/0)-(d.next?.order??1/0)||o.room.name.localeCompare(d.room.name,"de"))}var U=class{hass;constructor(e){this.hass=e}async list(){let e=await this.hass().callWS({type:"scheduler"});if(!Array.isArray(e))throw new Error("Die Scheduler-Integration liefert ein unbekanntes Antwortformat.");if(e.some(t=>!t||typeof t.schedule_id!="string"||!Array.isArray(t.timeslots)||!Array.isArray(t.weekdays)))throw new Error("Die Zeitpl\xE4ne konnten nicht sicher gelesen werden.");return e}async item(e){let t=await this.hass().callWS({type:"scheduler/item",schedule_id:e});if(!t||t.schedule_id!==e||!Array.isArray(t.timeslots))throw new Error("Der Heizplan ist nicht mehr verf\xFCgbar. Bitte neu laden.");return t}async save(e,t){let i=I(e,this.hass(),t);if(i)throw new Error(i);let s=await this.list(),n=!0;if(t){let p=await this.item(t.schedule_id);if(n=p.enabled!==!1,R(p)!==R(t)||y(p))throw new Error("Dieser Plan wurde inzwischen ge\xE4ndert. Bitte schlie\xDFe den Editor und \xF6ffne den aktuellen Stand.")}if(X(e,s,this.hass(),t?.schedule_id).length&&n)throw new Error("F\xFCr diese Tage ist bereits ein anderer Heizplan aktiv. Bitte pausiere ihn zuerst oder w\xE4hle andere Tage.");let o=de(e,t),d=await this.hass().callApi("POST",t?"scheduler/edit":"scheduler/add",o);if(d===!1||d&&typeof d=="object"&&"success"in d&&d.success===!1)throw new Error("Die Scheduler-Integration hat den Heizplan nicht gespeichert.");let h=p=>JSON.stringify([p.name.trim(),p.entity,[...p.weekdays].sort(),p.periods.map(c=>c.mode==="off"?[c.start,"off"]:[c.start,c.mode||"temperature",c.temperature])]),u={...e,periods:e.periods.map(p=>p.mode!=="off"&&e.periods.some(c=>c.mode==="off")?{...p,mode:"heat"}:p)};for(let p of[0,100,250,500,1e3]){p&&await new Promise($=>setTimeout($,p));let c=await this.list();if(c.find($=>(t?$.schedule_id===t.schedule_id:!s.some(C=>C.schedule_id===$.schedule_id))&&!y($)&&h(P($))===h(u)))return c}throw new Error("Der Speicherauftrag wurde gesendet, konnte aber noch nicht best\xE4tigt werden. Bitte neu laden, bevor du erneut speicherst.")}async remove(e){let t=await this.item(e.schedule_id);if(R(t)!==R(e))throw new Error("Dieser Plan wurde inzwischen ge\xE4ndert. Bitte pr\xFCfe ihn erneut.");if(!(await this.hass().callApi("POST","scheduler/remove",{schedule_id:e.schedule_id}))?.success)throw new Error("Der Heizplan wurde nicht gel\xF6scht.");for(let s of[0,100,250,500,1e3]){s&&await new Promise(r=>setTimeout(r,s));let n=await this.list();if(!n.some(r=>r.schedule_id===e.schedule_id))return n}throw new Error("Der L\xF6schauftrag wurde gesendet. Bitte lade neu, um das Ergebnis zu pr\xFCfen.")}async toggle(e,t){let i=await this.item(e.schedule_id);if(i.entity_id!==e.entity_id)throw new Error("Der Plan wurde ver\xE4ndert. Bitte neu laden.");if(t){let s=await this.list();if(x(i).flatMap(r=>X({name:"",entity:r,weekdays:i.weekdays,periods:[]},s,this.hass(),i.schedule_id)).length)throw new Error("Ein anderer Plan f\xFCr diese Tage ist bereits aktiv. Bitte pausiere ihn zuerst.")}await this.hass().callService("switch",t?"turn_on":"turn_off",{entity_id:i.entity_id})}};var ve=`
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
.week-range { font-size:20px; font-weight:650; margin:4px 0 8px; }
.today-button { border-color:var(--hp-accent-text); }
.recurring { border-top:1px solid var(--hp-line); margin-top:28px; padding-top:22px; }
.recurring > p { margin-top:6px; }
.recurring-list { display:grid; gap:8px; margin-top:14px; }
.recurring-plan { display:flex; align-items:center; gap:14px; flex-wrap:wrap; border:1px solid var(--hp-line); border-radius:12px; padding:14px; }
.recurring-copy { flex:1 1 180px; min-width:0; overflow-wrap:anywhere; }
.recurring-copy strong,.recurring-copy small { display:block; }
.recurring-plan.paused .recurring-copy { color:var(--hp-muted); }
.recurring-plan > .pill { flex-shrink:0; }
@container(max-width:350px){.week-range{font-size:17px}}
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
/* Compact plan editor: one row per period on wide screens, two short rows on phones. */
.edit-period { grid-template-columns: 172px auto minmax(0, 1fr) 44px; grid-template-areas: "when mode temp delete"; gap: 10px 12px; padding: 10px 0; }
.edit-period > .period-when { grid-area: when; display:flex; align-items:center; gap:8px; min-width:0; }
.edit-period > .period-mode { grid-area: mode; justify-self: start; }
.edit-period > .stepper, .edit-period > .off-period { grid-area: temp; }
.edit-period > .delete { grid-area: delete; }
.edit-period input[type="time"] { display:block; width:96px; flex:0 0 96px; margin:0; min-height:44px; padding:8px 10px; }
.edit-period input[type="time"]:disabled { opacity:1; color:var(--hp-muted); background:transparent; border-color:transparent; }
.period-end { font-size:13px; color:var(--hp-muted); white-space:nowrap; }
.period-mode { display:inline-flex; border:1px solid var(--hp-line); border-radius:10px; padding:2px; gap:2px; background:var(--hp-bg); }
.mode-chip { border:0; background:transparent; color:var(--hp-muted); border-radius:8px; min-height:40px; padding:0 12px; font-size:13px; font-weight:600; }
.mode-chip.active { background:var(--hp-tint); color:var(--hp-accent-text); }
.mode-chip:disabled { opacity:.4; }
.edit-period .stepper { max-width:200px; }
.edit-period .stepper button { flex-basis:40px; width:40px; height:44px; }
.edit-period .stepper input { min-height:44px; font-size:17px; font-weight:600; }
.edit-period .off-period { padding:0; color:var(--hp-muted); font-size:14px; }
.fixed-fields { display:grid; grid-template-columns:1fr 1fr; gap:4px 16px; margin-bottom:18px; }
.fixed-fields small { display:block; font-size:11px; color:var(--hp-muted); }
.fixed-fields strong { display:block; font-size:16px; overflow-wrap:anywhere; }
.fixed-fields .helper { grid-column:1 / -1; margin:6px 0 0; }
.dialog-footer { flex-wrap:wrap; }
.footer-error { flex:1 1 100%; padding:0 0 4px; }
.footer-error[hidden] { display:none; }
@media (max-width: 600px) {
  .edit-period { grid-template-columns: minmax(0, 1fr) auto 44px; grid-template-areas: "when when delete" "mode temp temp"; padding: 12px 0; gap: 8px 10px; }
  .edit-period > .period-when { grid-area: when; }
  .edit-period > .period-mode { grid-area: mode; }
  .edit-period > .stepper, .edit-period > .off-period { grid-area: temp; }
  .edit-period > .delete { grid-area: delete; }
  .edit-period .stepper { max-width:none; width:auto; justify-self:end; }
  .edit-period .stepper input { width:64px; flex:0 0 64px; }
  .edit-period .off-period { justify-self:end; }
  .fixed-fields { grid-template-columns:1fr; }
}
/* Phone overview: the room picker is the heading; status and week header are condensed. */
@container (max-width:760px) {
  .room-select { margin-bottom:8px; }
  .room-select select { margin-top:0; border:0; background-color:transparent; padding:4px 28px 4px 0; min-height:44px; font-size:24px; font-weight:750; letter-spacing:-.5px; color:var(--hp-fg); }
  .hero-title > .row, .hero-title > h2, .hero-title > small { display:none; }
  .hero { margin-bottom:12px; }
  .readings { margin-top:0; }
  .hero > div:last-child { margin-top:10px; }
  .next { margin:0 0 16px; padding:10px 12px; }
  .week-head { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; column-gap:8px; }
  .week-head > div:first-child { display:contents; }
  .week-head .eyebrow { grid-column:1 / -1; }
  .week-head h3 { grid-column:1; }
  .week-navigation { grid-column:2; }
  .week-head .week-range { display:none; }
  .week-head h3 { font-size:17px; margin-top:2px; }
  .week-navigation { margin-left:0; flex-shrink:0; }
  .recurring-plan { flex-wrap:nowrap; padding:10px 12px; gap:10px; }
  .recurring-copy { flex:1 1 auto; }
  .recurring-plan .btn { padding:8px 10px; }
}
/* 1.4.1: day timeline, insert buttons, favourite temperatures, compact overview */
.edit-timeline-wrap { margin:4px 0 6px; }
.edit-timeline { display:flex; height:30px; border-radius:8px; overflow:hidden; gap:2px; background:var(--hp-line); }
.tl-seg { display:flex; align-items:center; justify-content:center; min-width:3px; font-size:11px; font-weight:650; color:var(--hp-fg); background:color-mix(in srgb, var(--hp-accent-text) 14%, var(--hp-bg)); overflow:hidden; white-space:nowrap; }
.tl-seg.warm { background:color-mix(in srgb, var(--hp-warm) 30%, var(--hp-bg)); }
.tl-seg.off { background:var(--hp-bg); color:var(--hp-muted); background-image:repeating-linear-gradient(135deg, transparent 0 5px, var(--hp-line) 5px 6px); }
.timeline-scale { display:flex; justify-content:space-between; font-size:10px; color:var(--hp-muted); margin-top:3px; }
.edit-period { position:relative; grid-template-columns: 172px auto auto minmax(0, 1fr) 44px; grid-template-areas: "when mode temp fav delete"; }
.edit-period > .favorites { grid-area: fav; display:flex; gap:4px; justify-self:start; }
.fav-chip { border:1px solid var(--hp-line); background:transparent; color:var(--hp-fg); border-radius:999px; min-width:44px; min-height:36px; padding:0 8px; font-size:13px; font-weight:600; }
.fav-chip.active { background:var(--hp-tint); color:var(--hp-accent-text); border-color:transparent; }
.insert-period { position:absolute; left:50%; bottom:0; transform:translate(-50%, 50%); z-index:1; width:28px; height:28px; padding:0; border-radius:50%; border:1px solid var(--hp-line); background:var(--hp-bg); color:var(--hp-muted); display:grid; place-items:center; opacity:.85; }
.insert-period::before { content:""; position:absolute; inset:-8px; }
.insert-period .icon, .insert-period svg { width:14px; height:14px; }
.insert-period:hover, .insert-period:focus-visible { opacity:1; color:var(--hp-accent-text); border-color:var(--hp-accent-text); }
@media (max-width: 600px) {
  .edit-period { grid-template-columns: minmax(0, 1fr) auto 44px; grid-template-areas: "when fav delete" "mode temp temp"; }
  .edit-period > .favorites { justify-self:end; }
  .fav-chip { min-width:40px; padding:0 6px; }
  .fav-chip.active, .fav-chip.extra { display:none; }
}
@container (max-width:760px) {
  .overview { padding:16px 20px; }
  .overview-head { flex-wrap:nowrap; align-items:center; margin-bottom:14px; }
  .overview-head .overview-intro { display:none; }
  .overview-head h2 { font-size:22px; }
  .overview-room { grid-template-columns:minmax(0,1fr) auto; gap:4px 12px; padding:12px 14px; }
  .overview-room > .icon, .overview-room > svg { display:none; }
  .overview-room-name { grid-column:1; grid-row:1; }
  .overview-event { grid-column:2 !important; grid-row:1; text-align:right; }
  .overview-room-name > strong { font-size:16px; }
  .overview-event > strong { font-size:17px; }
  .overview-event small { display:none; }
  .recurring-plan .btn-label { display:none; }
  .recurring-plan .btn { min-width:44px; justify-content:center; }
}
.field .optional { font-weight:400; color:var(--muted, var(--secondary-text-color)); }
.field .helper { display:block; margin-top:4px; }
.auto-note { display:block; color:var(--muted, var(--secondary-text-color)); font-size:12px; margin-top:2px; }
`;var l=a=>String(a??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),xe={overview:"M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",home:"M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8",heat:"M8 3c-5 6 3 6 0 12m5-12c-5 6 3 6 0 12m5-12c-5 6 3 6 0 12M4 21h16",clock:"M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",plus:"M12 5v14M5 12h14",close:"m6 6 12 12M18 6 6 18",edit:"m14 5 5 5M4 20l5-1L21 7l-4-4L5 15z",copy:"M9 8h11v13H9zM5 16H3V3h12v2",refresh:"M20 8a8 8 0 1 0 0 9M20 3v5h-5",moon:"M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12",sun:"M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",bin:"M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7",check:"m5 12 4 4L19 6",arrow:"m8 5 7 7-7 7",lock:"M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3"},f=a=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${xe[a]||xe.home}"/></svg>`,ee=class extends HTMLElement{root=this.attachShadow({mode:"open"});config={type:"custom:heatingplan-card"};currentHass;schedules=[];loaded=!1;error="";message="";busy=!1;room="";day=0;weekOffset=0;overview=!1;calendar={};calendarKey="";calendarExpires=0;calendarRequest=0;edit;quick;deletion;undo;unsubscribe;subscribing=!1;subscribedConnection;refreshId=0;timer;queued=!1;renderedMarkup="";api=new U(()=>{if(!this.currentHass)throw new Error("Home Assistant ist noch nicht verbunden.");return this.currentHass});constructor(){super(),this.root.addEventListener("click",e=>{this.handleClick(e)}),this.root.addEventListener("change",e=>this.change(e)),this.root.addEventListener("input",e=>this.input(e)),this.root.addEventListener("keydown",e=>this.key(e)),this.root.addEventListener("touchstart",e=>this.swipeStart(e),{passive:!0}),this.root.addEventListener("touchend",e=>this.swipeEnd(e),{passive:!0})}setConfig(e){if(!e||e.type!=="custom:heatingplan-card")throw new Error("Verwende type: custom:heatingplan-card.");if(e.entities&&(!Array.isArray(e.entities)||e.entities.some(t=>typeof t!="string"||!t.startsWith("climate."))))throw new Error("entities muss eine Liste von Thermostaten sein.");this.config={...e},this.requestRender()}set hass(e){let t=!this.currentHass;this.currentHass=e,t&&(this.day=D(e).day),!this.edit&&!this.quick&&!this.deletion&&this.requestRender(),this.isConnected&&(this.subscribe(),t&&this.refresh(),this.refreshCalendar())}get hass(){return this.currentHass}getCardSize(){return 9}getGridOptions(){return{columns:24,rows:10,min_columns:6,min_rows:6}}static getConfigElement(){return document.createElement("heatingplan-card-editor")}static getStubConfig(){return{type:"custom:heatingplan-card",title:"Heizplan"}}connectedCallback(){this.render(),this.currentHass&&(this.subscribe(),this.refresh()),this.timer=setInterval(()=>{this.refreshCalendar(),!this.edit&&!this.quick&&!this.deletion&&this.requestRender(),!this.unsubscribe&&this.currentHass&&!this.busy&&this.refresh()},6e4)}disconnectedCallback(){this.unsubscribe?.(),this.unsubscribe=void 0,this.subscribedConnection=void 0,this.refreshId++,this.calendarRequest++,this.calendarKey="",this.timer&&clearInterval(this.timer)}requestRender(){this.queued||(this.queued=!0,queueMicrotask(()=>{this.queued=!1,this.isConnected&&this.render()}))}subscribe(){let e=this.currentHass?.connection;!e||this.subscribing||e===this.subscribedConnection||(this.unsubscribe?.(),this.unsubscribe=void 0,this.subscribedConnection=e,this.subscribing=!0,e.subscribeMessage(()=>{this.busy||this.refresh()},{type:"scheduler_updated"}).then(t=>{this.isConnected&&this.currentHass?.connection===e?this.unsubscribe=t:t()}).catch(()=>{this.subscribedConnection=void 0}).finally(()=>{this.subscribing=!1}))}async refresh(){let e=++this.refreshId;try{let t=await this.api.list();if(e!==this.refreshId||!this.isConnected)return;this.schedules=t,this.refreshCalendar(),this.loaded=!0,this.error=""}catch(t){if(e!==this.refreshId)return;this.error=this.errorText(t)}!this.edit&&!this.quick&&!this.deletion&&this.requestRender()}async refreshCalendar(e=!1){if(!this.currentHass||!this.isConnected||!this.schedules.some(N))return;let t=this.overview?Z(this.hass):j(this.hass,this.weekOffset),i=fe(this.hass,t);if(!e&&i===this.calendarKey&&Date.now()<this.calendarExpires)return;let s=++this.calendarRequest;this.calendarKey=i,this.calendarExpires=Date.now()+3e5,this.calendar={},!this.edit&&!this.quick&&!this.deletion&&this.requestRender();let n=await ge(this.hass,t);s!==this.calendarRequest||!this.isConnected||(this.calendar=n,!this.edit&&!this.quick&&!this.deletion&&this.requestRender())}errorText(e){return e instanceof Error?e.message:"Die Verbindung ist unterbrochen. Bitte versuche es erneut."}rooms(){return this.currentHass?A(this.currentHass,this.config.entities):[]}selected(){let e=this.rooms();return e.find(t=>t.id===this.room)||e[0]}unit(){return this.currentHass?.config?.unit_system?.temperature||"\xB0C"}render(){let e=this.root.querySelector(".dialog-body")?.scrollTop||0,t=this.root.activeElement?.getAttribute("aria-label"),i=this.root.querySelector("dialog"),s=this.rooms(),n=this.selected();n&&(this.room=n.id);let r=this.config.title||"Heizplan",o=`<style>${ve}</style><section class="app" ${this.edit||this.quick||this.deletion?"inert":""} aria-label="${l(r)}">
      <header class="top"><div><h1>${l(r)}</h1></div><div class="top-tools"><button class="btn ${this.overview?"primary":""}" data-action="overview" aria-label="Gesamt\xFCbersicht" title="Gesamt\xFCbersicht" aria-pressed="${this.overview}" ${!this.loaded||!n||this.busy?"disabled":""}>${f("overview")}</button><button class="btn" data-action="refresh" aria-label="Heizpl\xE4ne neu laden" ${this.busy?"disabled":""}>${f("refresh")}</button><button class="btn primary" data-action="new" aria-label="Neuer Plan" ${!n||!this.loaded||this.busy||this.error?"disabled":""}>${f("plus")}<span class="text">Neuer Plan</span></button></div></header>
      ${this.error?`<div role="alert" class="status error"><span>${l(this.error)}</span><button class="btn small" data-action="refresh">Erneut versuchen</button></div>`:""}
      ${this.message?`<div role="status" class="status"><span>${f("check")} ${l(this.message)}</span>${this.undo?'<button class="btn small" data-action="undo">R\xFCckg\xE4ngig</button>':""}<button class="btn small" aria-label="Meldung schlie\xDFen" data-action="dismiss">${f("close")}</button></div>`:""}
      ${!this.currentHass||!this.loaded&&!this.error?'<div class="loading" role="status">Heizpl\xE4ne werden geladen \u2026<div class="skeleton"></div><div class="skeleton"></div></div>':n?this.overview?this.overviewHtml():`<div class="layout"><nav class="rooms" aria-label="R\xE4ume"><p class="section-label">Meine R\xE4ume \xB7 ${s.length}</p>${s.map(p=>this.roomHtml(p)).join("")}</nav><main class="main"><label class="field room-select"><span class="sr-only">Raum</span><select id="room-select" aria-label="Raum ausw\xE4hlen">${s.map(p=>`<option value="${l(p.id)}" ${p.id===n.id?"selected":""}>${l(p.name)}${s.filter(c=>c.name===p.name).length>1?` \xB7 ${l(p.detail)}`:""}</option>`).join("")}</select></label>${this.roomContent(n)}</main></div>`:`<div class="empty-state">${f("home")}<h2>Noch keine Thermostate</h2><p>W\xE4hle in der Kartenkonfiguration die Thermostate aus, die du hier steuern m\xF6chtest.</p></div>`}
    </section>${this.edit?this.editorHtml(this.edit):this.quick?this.quickHtml():this.deletion?this.deleteHtml():""}`;if(o===this.renderedMarkup)return;let d=[],h=this;for(;h;){d.push({element:h,top:h.scrollTop,left:h.scrollLeft});let p=h.getRootNode();h=h.parentElement||(p instanceof ShadowRoot?p.host:null)}i?.close(),this.root.innerHTML=o,this.renderedMarkup=o;let u=this.root.querySelector("dialog");if(u){u.addEventListener("cancel",c=>{c.preventDefault(),this.close()}),u.showModal();let p=this.root.querySelector(".dialog-body");p&&(p.scrollTop=e),t&&[...u.querySelectorAll("[aria-label]")].find(c=>c.getAttribute("aria-label")===t)?.focus({preventScroll:!0})}for(let{element:p,top:c,left:g}of d)p.scrollTop!==c&&(p.scrollTop=c),p.scrollLeft!==g&&(p.scrollLeft=g)}overviewHtml(){let e=new Date,t=S(this.hass,e),i=Z(this.hass,e),s=be(this.rooms(),this.schedules,this.hass,this.calendar,e),n={none:"Kein Heizplan",paused:"Alle Pl\xE4ne pausiert",unknown:"N\xE4chste Schaltung noch unklar",conflict:"Mehrere aktive Pl\xE4ne \xB7 bitte pr\xFCfen",later:"Keine Schaltung in den n\xE4chsten 7 Tagen",next:""};return`<main class="overview" aria-label="Gesamt\xFCbersicht aller R\xE4ume"><div class="between overview-head"><div><p class="eyebrow">Alle R\xE4ume</p><h2>Als N\xE4chstes</h2><p class="muted overview-intro">Die n\xE4chste geplante Schaltung pro Raum, nach Uhrzeit sortiert.</p></div><button class="btn small" data-action="overview">Zur Raumansicht</button></div><div class="overview-list">${s.map(r=>{let o=r.next,d=o?`${o.date===t?"Heute":o.date===i[1]?"Morgen":E(o.date)} \xB7 ${k(o.minute)} Uhr`:"";return`<button class="overview-room ${r.status==="paused"?"paused":""}" data-action="overview-room" data-id="${l(r.room.id)}" aria-label="${l(r.room.name)}: Heizpl\xE4ne ansehen"><span class="overview-room-name"><strong>${l(r.room.name)}</strong><small>${l(r.room.detail)} \xB7 ${r.unavailable?"Nicht erreichbar":`Jetzt ${r.room.state.state==="off"?"Aus":`${v(r.room.state.attributes.temperature)} ${l(this.unit())}`}`}</small></span><span class="overview-event">${o?`<span class="overview-time">${d}</span><strong>${r.status==="conflict"?"Pl\xE4ne pr\xFCfen":l(G(o.slot,this.unit()))}</strong>`:`<strong>${n[r.status]}</strong>`}<small>${r.status==="next"&&o?l(this.planName(o.plan)):r.status==="unknown"?"Kalender, Sonderregeln oder Planstatus pr\xFCfen":r.status==="conflict"?n.conflict:""}${r.paused&&r.status!=="paused"?` \xB7 ${r.paused} pausiert`:""}</small></span>${f("arrow")}</button>`}).join("")}</div><p class="footnote">Tippe auf einen Raum, um seine Heizpl\xE4ne zu \xF6ffnen. Die Vorschau ber\xFCcksichtigt heute und die n\xE4chsten sieben Tage. Andere Steuerungen k\xF6nnen die tats\xE4chliche Einstellung \xE4ndern.</p>${this.recurringHtml(this.schedules,!0)}</main>`}recurringHtml(e,t=!1){let i=this.rooms(),s=e.filter(n=>(!n.repeat_type||n.repeat_type==="repeat")&&x(n).some(r=>i.some(o=>o.id===r)));return`<section class="recurring" aria-label="Wiederkehrende Pl\xE4ne"><h3>Wiederkehrende Pl\xE4ne</h3><p class="muted">Diese Pl\xE4ne werden an den angegebenen Tagen wiederholt ausgef\xFChrt.</p>${s.length?`<div class="recurring-list">${s.map(n=>{let r=i.filter(u=>x(n).includes(u.id)).map(u=>u.name).join(", "),o=["unknown","unavailable"].includes(this.hass.states[n.entity_id]?.state),d=w(n,this.hass),h=J(n.weekdays)||"Besondere Tagesregeln";return`<article class="recurring-plan ${!d&&!o?"paused":""}"><div class="recurring-copy"><strong>${l(this.planName(n))}</strong><small>${t?`${l(r)} \xB7 `:""}${l(h)}</small>${n.start_date||n.end_date?`<small>Zeitraum: ${l(n.start_date||"offen")} bis ${l(n.end_date||"offen")}</small>`:""}</div><span class="pill ${o?"warn":""}">${o?"Status unklar":d?"Aktiv":"Pausiert"}</span>${y(n)?"<small>Sonderregeln</small>":`<button class="btn small" data-action="edit" data-id="${l(n.schedule_id)}" aria-label="Wiederkehrenden Plan ${l(this.planName(n))} bearbeiten">${f("edit")}<span class="btn-label"> Bearbeiten</span></button>`}</article>`}).join("")}</div>`:'<p class="recurring-empty muted">Keine wiederkehrenden Pl\xE4ne vorhanden.</p>'}</section>`}roomHtml(e){return`<button class="room ${e.id===this.room?"active":""}" data-action="room" data-id="${l(e.id)}" aria-current="${e.id===this.room?"true":"false"}"><span class="room-icon">${f(e.state.state!=="off"&&e.state.attributes.hvac_action==="heating"?"heat":"home")}</span><span class="room-copy"><strong>${l(e.name)}</strong><small>${e.state.state!=="off"&&e.state.attributes.hvac_action==="heating"?'<span class="dot"></span>Heizt gerade':l(e.detail)}</small></span><span class="room-temp">${v(e.state.attributes.current_temperature)}\xB0</span></button>`}roomContent(e){let t=this.schedules.filter(c=>x(c).includes(e.id)),i=j(this.hass,this.weekOffset),s=i[this.day],n=me(i[0]),r=this.weekOffset===0?"Diese Woche":this.weekOffset===1?"N\xE4chste Woche":this.weekOffset===-1?"Vorherige Woche":"Ausgew\xE4hlte Woche",o=t.filter(c=>M(c,s,this.calendar)!=="no"),d=t.filter(c=>w(c,this.hass)),h=d.some(N)?null:Q(this.schedules,this.hass,e.id),u=t.filter(c=>M(c,s,this.calendar)==="yes"&&w(c,this.hass)).length>1,p=["unavailable","unknown"].includes(e.state.state);return`<section class="hero"><div class="hero-title"><div class="row" style="margin-bottom:5px"><p class="eyebrow">Raum\xFCbersicht</p></div><h2>${l(e.name)}</h2><small>${l(e.detail)}</small><div class="readings"><div class="reading"><small>Raumtemperatur</small><strong>${v(e.state.attributes.current_temperature)} <span>${l(this.unit())}</span></strong></div><div class="reading"><small>Aktuell eingestellt</small><strong>${e.state.state==="off"?"Aus":`${v(e.state.attributes.temperature)} <span>${l(this.unit())}</span>`}</strong></div></div></div><div style="text-align:right"><span class="pill ${p?"warn":""}">${p?"Nicht erreichbar":e.state.state!=="off"&&e.state.attributes.hvac_action==="heating"?`${f("heat")} Heizt gerade`:e.state.state==="off"?"Heizung aus":d.length?"Heizplan aktiv":"Kein aktiver Plan"}</span><br><button class="btn small" style="margin-top:14px" data-action="quick" ${p||this.busy?"disabled":""}>Heizung steuern</button></div></section>
    <div class="next">${f("clock")}<span>${u?"Mehrere Pl\xE4ne sind gleichzeitig aktiv. Bitte pr\xFCfe die Heizzeiten.":h?this.nextText(h):d.length?"Die n\xE4chste Schaltung wird vom aktiven Heizplan bestimmt.":"Ohne aktiven Heizplan bleibt die eingestellte Temperatur bestehen."}</span></div>
    <div class="between week-head"><div><p class="eyebrow">${r} \xB7 KW ${n.week} \xB7 ${n.year}</p><p class="week-range">${E(i[0])}${i[0].slice(0,4)} \u2013 ${E(i[6])}${i[6].slice(0,4)}</p><h3>${Y[this.day]}, ${E(s)}</h3></div><div class="week-navigation"><button class="btn quiet small" data-action="previous-week" aria-label="Vorherige Woche">\u2039</button>${this.weekOffset!==0||this.day!==D(this.hass).day?'<button class="btn small today-button" data-action="today">Heute</button>':""}<button class="btn quiet small" data-action="next-week" aria-label="N\xE4chste Woche">\u203A</button></div></div><div class="day-tabs" role="group" aria-label="Wochentag">${m.map((c,g)=>`<button class="day-tab ${g===this.day?"active":""}" data-action="day" data-index="${g}" aria-pressed="${g===this.day}">${H[g]}<small>${E(i[g])}</small>${i[g]===S(this.hass)?'<span class="today"></span>':""}</button>`).join("")}</div>
    <div class="week-grid" aria-label="Wochen\xFCbersicht">${i.map((c,g)=>this.weekColumn(t,c,g)).join("")}</div>
    ${o.length?o.map(c=>this.planHtml(c,M(c,s,this.calendar))).join(""):`<div class="empty-state">${f("sun")}<h3>Kein Heizplan vorhanden</h3><p>F\xFCr ${Y[this.day]}, ${E(s)} ist kein Heizplan zugeordnet.</p><button class="btn primary" data-action="new-day">${f("plus")} Heizzeiten festlegen</button></div>`}
    ${this.recurringHtml(t)}
    <p class="footnote">Ein pausierter Plan schaltet die Heizung nicht aus. Deine Zeitpl\xE4ne laufen in Home Assistant weiter, auch wenn du diese Ansicht schlie\xDFt.</p>`}roomName(e){if(e)return this.rooms().find(t=>t.id===e)?.name||A(this.hass,[e])[0]?.name}planName(e){return e.name?.trim()||O(e.weekdays,this.roomName(x(e)[0]))}nextParts(e){let t=D(this.hass),i=t.minute+e.minutes,s=Math.floor(i/1440),n=s===0?"":s===1?"Morgen ":`${H[(t.day+s)%7]} `,r=Math.floor(e.minutes/60);return{when:`${n}${k(i%1440)}`,value:e.off?"Heizung aus":`${v(e.temperature)} ${l(this.unit())}`,distance:e.minutes<1440?`in ${r?`${r} Std. `:""}${e.minutes%60} Min.`:`in ${Math.floor(e.minutes/1440)} Tagen`}}nextText(e){let t=this.nextParts(e);return`N\xE4chste \xC4nderung <strong>${t.when} \u2192 ${t.value}</strong> \xB7 ${t.distance}`}roomNext(e){return this.schedules.filter(i=>x(i).includes(e)&&w(i,this.hass)).some(N)?void 0:Q(this.schedules,this.hass,e)}weekColumn(e,t,i){let s=e.filter(n=>M(n,t,this.calendar)!=="no");return`<div class="week-column ${t===S(this.hass)?"today-col":""}"><small>${H[i]} \xB7 ${E(t)}</small>${s.length?s.map(n=>{let r=M(n,t,this.calendar),o=w(n,this.hass);return`<div class="week-plan ${o?"":"paused"} ${r==="unknown"?"uncertain":""}"><div class="week-plan-label"><strong>${l(this.planName(n))}</strong><span>${o?"Aktiv":"Pausiert"}</span>${this.calendarNote(n,r,t)}</div>${y(n)?'<div class="segment empty">Sonderregeln</div>':n.timeslots.map(d=>`<div class="segment ${Number(d.actions[0].service_data?.temperature)>=20?"warm":""}"><span>${l(d.start.slice(0,5))}</span><strong>${q(d)?"Aus":`${v(d.actions[0].service_data?.temperature)}\xB0`}</strong></div>`).join("")}</div>`}).join(""):'<div class="segment empty">Kein Heizplan</div>'}</div>`}calendarNote(e,t,i){return t==="unknown"?'<span class="calendar-note">Zuordnung noch offen</span>':N(e)?`<span class="calendar-note">${this.calendar[i]?.source==="standard"?"Standardwoche":"Arbeitskalender"}</span>`:""}planHtml(e,t="yes"){let i=y(e),s=w(e,this.hass),n=D(this.hass);return`<article class="plan ${s?"":"paused"} ${t==="unknown"?"uncertain":""}"><div class="plan-head"><div><h3>${l(this.planName(e))}</h3><small>${l(J(e.weekdays))}</small>${this.calendarNote(e,t,j(this.hass,this.weekOffset)[this.day])}</div><span class="pill ${t==="unknown"?"warn":""}">${s?"Aktiv":"Pausiert"}</span></div><div class="plan-body">${i?`<div class="notice" style="margin:14px">${f("lock")} ${l(i)} Die Einstellungen bleiben erhalten. Bearbeite diesen Plan in deiner bisherigen Scheduler-Oberfl\xE4che.</div>`:e.timeslots.map(r=>{let o=s&&j(this.hass,this.weekOffset)[this.day]===S(this.hass)&&t==="yes"&&_(r.start)<=n.minute&&F(r.stop)>n.minute;return`<div class="period ${o?"active-period":""}">${f(Number(r.actions[0].service_data?.temperature)>=20?"sun":"moon")}<div><strong>${l(r.start.slice(0,5))} \u2013 ${k(F(r.stop))}</strong>${o?"<small>Jetzt im Heizplan</small>":""}</div><div class="period-temp">${l(G(r,this.unit()))}</div></div>`}).join("")}</div><footer class="plan-footer"><button class="toggle" role="switch" aria-checked="${s}" aria-label="Heizplan ${l(this.planName(e))} aktiv" data-action="toggle" data-id="${l(e.schedule_id)}" ${this.busy?"disabled":""}><span class="switch"></span>${s?"Plan aktiv":"Plan pausiert"}</button><div class="plan-actions"><button class="btn quiet small" data-action="delete" data-id="${l(e.schedule_id)}" aria-label="Heizplan ${l(this.planName(e))} l\xF6schen" ${this.busy?"disabled":""}>${f("bin")}</button>${i?"":`<button class="btn quiet small" data-action="copy" data-id="${l(e.schedule_id)}" ${this.busy?"disabled":""}>${f("copy")} Kopieren</button><button class="btn small" data-action="edit" data-id="${l(e.schedule_id)}" ${this.busy?"disabled":""}>${f("edit")} Bearbeiten</button>`}</div></footer></article>`}editorHtml(e){let t=e.draft,i=T(this.hass,t.entity),s=e.customDays?"custom":ce(t.weekdays),n=ue(this.schedules,t.entity,t.periods).filter(r=>r>=i.min&&r<=i.max);return`<dialog class="sheet" role="dialog" aria-modal="true" aria-labelledby="edit-title"><section class="dialog"><header class="dialog-head"><div><p class="eyebrow">Heizzeiten gestalten</p><h2 id="edit-title">${e.original?"Heizplan bearbeiten":"Neuer Heizplan"}</h2></div><button class="btn quiet" data-action="close" aria-label="Editor schlie\xDFen" ${this.busy?"disabled":""}>${f("close")}</button></header><div class="dialog-body" ${this.busy?"inert":""}>${e.original?`<div class="fixed-fields"><div><small>Name</small><strong class="fixed-name">${l(t.name.trim()||O(t.weekdays,this.roomName(t.entity)))}</strong>${t.name.trim()?"":'<small class="auto-note">Automatischer Name aus Raum und Tagen</small>'}</div><div><small>Thermostat</small><strong>${l(this.rooms().find(r=>r.id===t.entity)?.name||t.entity)}</strong></div><p class="helper">Name und Thermostat sind fest. \xDCber \u201EKopieren\u201C legst du den Plan unter neuem Namen an.</p></div>`:`<div class="two-fields"><label class="field">Name des Plans <span class="optional">(optional)</span><input class="input" data-field="name" value="${l(t.name)}" maxlength="80" autocomplete="off" placeholder="${l(O(t.weekdays,this.roomName(t.entity)))}" aria-describedby="name-auto"><small class="helper" id="name-auto">Leer lassen f\xFCr einen automatischen Namen aus Raum und Tagen.</small></label><label class="field">Thermostat<select data-field="entity">${this.rooms().map(r=>`<option value="${l(r.id)}" ${r.id===t.entity?"selected":""}>${l(r.name)} \xB7 ${l(r.detail)}</option>`).join("")}</select></label></div>`}<h3>F\xFCr welche Tage?</h3><label class="field" style="margin-top:10px">Tagesauswahl<select data-field="calendar">${[["work","Montag bis Freitag"],["weekend","Samstag und Sonntag"],["all","Jeden Tag"],["workday","Arbeitstage laut Arbeitskalender"],["free","Freie Tage laut Arbeitskalender"],["custom","Eigene Auswahl"]].map(([r,o])=>`<option value="${r}" ${r===s?"selected":""}>${o}</option>`).join("")}</select></label>${s==="workday"||s==="free"?'<p class="helper">Feiertage und freie Tage bestimmt dein Arbeitskalender in Home Assistant.</p>':""}${s==="custom"?`<div class="day-choice">${m.map((r,o)=>`<label><input type="checkbox" data-day="${r}" ${t.weekdays.includes(r)?"checked":""}><span>${H[o]}</span></label>`).join("")}</div>`:""}<div class="between"><h3>Wie warm soll es sein?</h3><small>${t.periods.length} Abschnitte</small></div><p class="helper">Jede Einstellung gilt ab der Uhrzeit bis zum n\xE4chsten Abschnitt. Temperaturen in ${l(this.unit())}.</p><div class="edit-timeline-wrap" aria-hidden="true"><div class="edit-timeline">${this.timelineHtml(t)}</div><div class="timeline-scale"><span>0</span><span>6</span><span>12</span><span>18</span><span>24 Uhr</span></div></div><div class="edit-periods">${t.periods.map((r,o)=>this.periodHtml(r,o,t,n)).join("")}</div><button class="btn quiet" style="margin-top:12px" data-action="add-period" ${t.periods.length>=24?"disabled":""}>${f("plus")} Abschnitt hinzuf\xFCgen</button><div class="notice">${e.original?"\xC4nderungen an einem aktiven Plan k\xF6nnen sofort die Temperatur anpassen.":"Mit dem Speichern wird dieser Plan aktiviert. Die passende Einstellung wird sofort angewendet."} Die letzte Einstellung gilt bis 24:00 Uhr.</div></div><footer class="dialog-footer"><div class="inline-error footer-error" role="alert" id="edit-error" ${e.error?"":"hidden"}>${l(e.error)}</div>${e.discard?'<span>\xC4nderungen verwerfen?</span><div class="actions"><button class="btn" data-action="keep">Weiter bearbeiten</button><button class="btn primary" data-action="discard">Verwerfen</button></div>':`<div class="actions"><button class="btn" data-action="close" ${this.busy?"disabled":""}>Abbrechen</button><button class="btn primary" data-action="save" ${this.busy?"disabled":""}>${this.busy?"Wird gespeichert \u2026":"Heizplan speichern"}</button></div>`}</footer></section></dialog>`}periodHtml(e,t,i,s=[]){let n=T(this.hass,i.entity),r=e.mode==="off",o=z(this.hass,i.entity,"off")&&z(this.hass,i.entity,"heat"),d=i.periods[t+1]?.start??1440,h=(u,p,c=!0)=>`<button class="mode-chip ${u==="off"===r?"active":""}" data-action="period-mode" data-index="${t}" data-value="${u}" aria-pressed="${u==="off"===r}" ${c?"":'disabled title="Dieses Thermostat unterst\xFCtzt den Aus-Modus nicht"'}>${p}</button>`;return`<div class="edit-period ${r?"is-off":""}"><div class="period-when"><input type="time" value="${k(e.start)}" step="60" data-start="${t}" aria-label="Beginn Abschnitt ${t+1}" ${t===0?"disabled":""}><span class="period-end" data-end="${t}">bis ${k(d)}</span></div><div class="period-mode" role="group" aria-label="Betrieb Abschnitt ${t+1}">${h("heat","Heizen")}${h("off","Aus",o)}</div>${r?'<p class="off-period">Heizung aus</p>':`<div class="stepper"><button data-action="step" data-index="${t}" data-delta="-1" aria-label="Abschnitt ${t+1} k\xE4lter">\u2212</button><input type="number" value="${e.temperature}" min="${n.min}" max="${n.max}" step="${n.step}" data-temperature="${t}" aria-label="Temperatur Abschnitt ${t+1} in ${l(this.unit())}"><button data-action="step" data-index="${t}" data-delta="1" aria-label="Abschnitt ${t+1} w\xE4rmer">+</button></div>`}${!r&&s.length>1?`<div class="favorites" role="group" aria-label="Schnellwahl Abschnitt ${t+1}">${s.map(u=>`<button class="fav-chip ${u===e.temperature?"active":s.filter(p=>p!==e.temperature).indexOf(u)>=2?"extra":""}" data-action="set-temperature" data-index="${t}" data-value="${u}" aria-label="Abschnitt ${t+1} auf ${v(u)} ${l(this.unit())}" aria-pressed="${u===e.temperature}">${v(u)}\xB0</button>`).join("")}</div>`:""}<button class="delete" data-action="remove-period" data-index="${t}" aria-label="Abschnitt ${t+1} entfernen" ${t===0?"disabled":""}>${f("bin")}</button>${i.periods.length<24&&d-e.start>=30?`<button class="insert-period" data-action="insert-period" data-index="${t}" aria-label="Abschnitt zwischen ${k(e.start)} und ${k(d)} einf\xFCgen" title="Abschnitt einf\xFCgen">${f("plus")}</button>`:""}</div>`}timelineHtml(e){return e.periods.map((t,i)=>{let s=e.periods[i+1]?.start??1440,n=s-t.start;if(!Number.isFinite(n)||n<=0)return"";let r=t.mode==="off";return`<span class="tl-seg ${r?"off":t.temperature>=20?"warm":"cool"}" style="flex:${n} 1 0">${n>=150?r?"Aus":`${v(t.temperature)}\xB0`:""}</span>`}).join("")}updateTimeline(){let e=this.root.querySelector(".edit-timeline");if(!e||!this.edit)return;let t=this.edit.draft.periods;t.some((i,s)=>!Number.isFinite(i.start)||s>0&&i.start<=t[s-1].start)||(e.innerHTML=this.timelineHtml(this.edit.draft))}deleteHtml(){return`<dialog class="sheet" role="dialog" aria-modal="true" aria-labelledby="delete-title"><section class="dialog" style="max-width:460px;height:auto"><header class="dialog-head"><h2 id="delete-title">Heizplan l\xF6schen?</h2></header><div class="dialog-body"><p><strong>${l(this.planName(this.deletion.schedule))}</strong> wird dauerhaft gel\xF6scht. Die aktuell eingestellte Raumtemperatur bleibt bestehen.</p><p class="helper">Du kannst den Plan stattdessen pausieren, wenn du ihn sp\xE4ter wieder verwenden m\xF6chtest.</p><div role="alert" class="inline-error">${l(this.deletion.error)}</div></div><footer class="dialog-footer"><button class="btn" data-action="close" ${this.busy?"disabled":""}>Behalten</button><button class="btn primary" data-action="confirm-delete" ${this.busy?"disabled":""}>${this.busy?"Wird gel\xF6scht \u2026":"Endg\xFCltig l\xF6schen"}</button></footer></section></dialog>`}quickHtml(){let e=this.selected(),t=T(this.hass,e.id),i=this.quick.mode==="off",s=this.schedules.some(o=>x(o).includes(e.id)&&w(o,this.hass)),n=this.roomNext(e.id),r=n?this.nextParts(n):void 0;return`<dialog class="sheet" role="dialog" aria-modal="true" aria-labelledby="quick-title"><section class="dialog quick-dialog"><header class="dialog-head"><div><p class="eyebrow">${l(e.name)}</p><h2 id="quick-title">Heizung steuern</h2></div><button class="btn quiet" data-action="close" aria-label="Schlie\xDFen" ${this.busy?"disabled":""}>${f("close")}</button></header><div class="dialog-body" ${this.busy?"inert":""}><div class="mode-buttons" role="group" aria-label="Heizungsbetrieb"><button class="btn ${i?"":"primary"}" data-action="quick-mode" data-mode="heat" aria-pressed="${!i}" ${e.state.state==="off"&&!z(this.hass,e.id,"heat")?"disabled":""}>Heizen</button><button class="btn ${i?"primary":""}" data-action="quick-mode" data-mode="off" aria-pressed="${i}" ${z(this.hass,e.id,"off")?"":"disabled"}>Heizung aus</button></div>${i?'<p class="off-period">Die Heizung wird ausgeschaltet.</p>':`<div class="stepper quick-stepper"><button data-action="quick-step" data-delta="-1" aria-label="K\xE4lter">\u2212</button><input type="number" data-field="quick" value="${this.quick.value}" min="${t.min}" max="${t.max}" step="${t.step}" aria-label="Zieltemperatur"><button data-action="quick-step" data-delta="1" aria-label="W\xE4rmer">+</button></div>`}<p class="helper quick-until">${r?`Gilt bis <strong>${r.when}</strong>. Dann \xFCbernimmt der Heizplan: <strong>${r.value}</strong>.`:s?"Ein aktiver Heizplan kann die Heizung sp\xE4ter wieder einschalten oder die Temperatur \xE4ndern.":"Die Einstellung bleibt bestehen, bis du sie \xE4nderst oder eine andere Steuerung eingreift."} Der Heizplan selbst wird nicht ge\xE4ndert.</p><div class="inline-error" role="alert">${l(this.quick.error)}</div></div><footer class="dialog-footer"><button class="btn" data-action="close" ${this.busy?"disabled":""}>Abbrechen</button><button class="btn primary" data-action="quick-save" ${this.busy?"disabled":""}>${this.busy?"Wird eingestellt \u2026":i?"Heizung ausschalten":"Temperatur einstellen"}</button></footer></section></dialog>`}focusDialog(){queueMicrotask(()=>this.root.querySelector(".dialog input:not(:disabled),.dialog button:not(:disabled)")?.focus())}focusTrigger(){queueMicrotask(()=>this.root.querySelector('[data-action="edit"], [data-action="new"]')?.focus())}openDraft(e,t){this.edit={draft:e,original:t,initial:JSON.stringify(e),error:"",discard:!1},this.render(),this.focusDialog()}input(e){let t=e.target;if(this.busy||(this.quick&&t.dataset.field==="quick"&&(this.quick.value=t.valueAsNumber),!this.edit))return;let i=this.edit.draft;if(t.dataset.field==="name"&&(i.name=t.value),t.dataset.temperature!==void 0&&(i.periods[Number(t.dataset.temperature)].temperature=t.valueAsNumber,this.updateTimeline()),t.dataset.start!==void 0){let s=Number(t.dataset.start);i.periods[s].start=_(t.value);let n=this.root.querySelector(`[data-end="${s-1}"]`);n&&Number.isFinite(i.periods[s].start)&&(n.textContent=`bis ${k(i.periods[s].start)}`),this.updateTimeline()}}change(e){let t=e.target;if(!this.busy){if(t.id==="room-select"){this.room=t.value,this.render();return}if(this.edit){if(t.dataset.day){this.edit.customDays=!0;let i=this.edit.draft.weekdays;this.edit.draft.weekdays=m.filter(s=>s===t.dataset.day?t.checked:i.includes(s)),this.root.querySelector('[data-field="name"]')?.setAttribute("placeholder",O(this.edit.draft.weekdays,this.roomName(this.edit.draft.entity)))}if(t.dataset.field==="calendar"){let i=t.value;this.edit.customDays=i==="custom",this.edit.draft.weekdays=he(i,this.edit.draft.weekdays),this.render()}t.dataset.field==="entity"&&(this.edit.draft.entity=t.value,this.render())}}}key(e){if(!(!this.edit&&!this.quick&&!this.deletion)&&(e.key==="Escape"&&(e.preventDefault(),this.close()),e.key==="Tab")){let t=[...this.root.querySelectorAll(".dialog button:not(:disabled),.dialog input:not(:disabled),.dialog select:not(:disabled)")],i=t[0],s=t.at(-1);e.shiftKey&&this.root.activeElement===i?(e.preventDefault(),s?.focus()):!e.shiftKey&&this.root.activeElement===s&&(e.preventDefault(),i?.focus())}}swipe;swipeStart(e){let t=e.target;this.swipe=e.touches.length===1&&!this.overview&&!this.edit&&!this.quick&&!this.deletion&&t.closest(".main")&&!t.closest("input, select, textarea, .day-tabs, .toggle")?{x:e.touches[0].clientX,y:e.touches[0].clientY,time:Date.now()}:void 0}swipeEnd(e){let t=this.swipe;if(this.swipe=void 0,!t||this.busy||Date.now()-t.time>800)return;let i=e.changedTouches[0].clientX-t.x,s=e.changedTouches[0].clientY-t.y;Math.abs(i)<60||Math.abs(i)<Math.abs(s)*2||this.shiftDay(i<0?1:-1)}shiftDay(e){let t=this.day+e;t<0||t>6?(this.weekOffset+=e,this.day=t<0?6:0,this.refreshCalendar()):this.day=t,this.render()}close(){if(!this.busy){if(this.edit&&JSON.stringify(this.edit.draft)!==this.edit.initial){this.edit.discard=!0,this.render(),this.focusDialog();return}this.edit=void 0,this.quick=void 0,this.deletion=void 0,this.render(),this.focusTrigger()}}async handleClick(e){let t=e.target.closest("[data-action]");if(!t||t.hasAttribute("disabled")||this.busy)return;let i=t.dataset.action,s=t.dataset.id,n=Number(t.dataset.index);if(i==="overview")this.overview=!this.overview,this.refreshCalendar(),this.render(),this.root.querySelector('[data-action="overview"]')?.focus({preventScroll:!0});else if(i==="overview-room")this.room=s,this.overview=!1,this.weekOffset=0,this.day=D(this.hass).day,this.refreshCalendar(),this.render(),this.root.querySelector('[data-action="overview"]')?.focus({preventScroll:!0});else if(i==="room")this.room=s,this.render();else if(i==="day")this.day=n,this.render();else if(i==="today")this.weekOffset=0,this.refreshCalendar(),this.day=D(this.hass).day,this.render();else if(i==="previous-week"||i==="next-week")this.weekOffset+=i==="next-week"?1:-1,this.refreshCalendar(),this.render();else if(i==="refresh")await this.refresh(),await this.refreshCalendar(!0);else if(i==="dismiss")this.message="",this.render();else if(i==="new"||i==="new-day"){let r=this.selected();if(r){let o=oe(r.id,this.hass);i==="new-day"&&(o.weekdays=[m[this.day]]),this.openDraft(o)}}else if(i==="edit"||i==="copy"){this.busy=!0;try{let r=await this.api.item(s),o=y(r);if(o)throw new Error(o);let d=P(r);i==="copy"?(d.name=d.name.trim()?`${d.name.trim()} \xB7 Kopie`.slice(0,80):"",this.openDraft(d)):this.openDraft(d,r)}catch(r){this.error=this.errorText(r)}finally{this.busy=!1,this.render(),this.edit&&this.focusDialog()}}else if(i==="close")this.close();else if(i==="discard")this.edit=void 0,this.render(),this.focusTrigger();else if(i==="keep"&&this.edit)this.edit.discard=!1,this.render(),this.focusDialog();else if(i==="insert-period"&&this.edit)this.edit.draft.periods=pe(this.edit.draft.periods,n),this.render(),this.root.querySelector(`[data-start="${n+1}"]`)?.focus({preventScroll:!0});else if(i==="set-temperature"&&this.edit){let r=this.edit.draft.periods[n];r&&(r.temperature=Number(t.dataset.value)),this.render()}else if(i==="period-mode"&&this.edit){let r=this.edit.draft.periods[n];r&&(r.mode=t.dataset.value==="off"?"off":"heat"),this.render()}else if(i==="add-period"&&this.edit)this.edit.draft.periods=le(this.edit.draft.periods),this.render();else if(i==="remove-period"&&this.edit&&n>0)this.edit.draft.periods.splice(n,1),this.render();else if(i==="step"&&this.edit){let r=T(this.hass,this.edit.draft.entity),o=this.edit.draft.periods[n];o.temperature=Number(Math.max(r.min,Math.min(r.max,(Number.isFinite(o.temperature)?o.temperature:r.min)+Number(t.dataset.delta)*r.step)).toFixed(3)),this.render()}else if(i==="save"&&this.edit){let r=this.edit,o=I(r.draft,this.hass,r.original);if(o){r.error=o,this.render();return}this.busy=!0,this.render();try{this.schedules=await this.api.save(r.draft,r.original),this.refreshCalendar();let d=this.schedules.find(h=>h.schedule_id===r.original?.schedule_id);this.undo=r.original&&d?{before:structuredClone(r.original),after:structuredClone(d)}:void 0,this.message="Dein Heizplan wurde gespeichert.",this.error="",this.edit=void 0,!r.draft.weekdays.includes(m[this.day])&&!r.draft.weekdays.some(h=>["workday","weekend"].includes(h))&&(this.day=Math.max(0,m.indexOf(r.draft.weekdays[0]))),this.room=r.draft.entity}catch(d){r.error=this.errorText(d)}finally{this.busy=!1,this.render(),this.edit||this.focusTrigger()}}else if(i==="toggle"){let r=this.schedules.find(o=>o.schedule_id===s);if(!r)return;this.busy=!0,this.render();try{await this.api.toggle(r,!w(r,this.hass)),this.message=w(r,this.hass)?"Heizplan wird pausiert. Die Heizung bleibt auf ihrer bisherigen Einstellung.":"Heizplan wird aktiviert.",this.undo=void 0,await this.refresh()}catch(o){this.error=this.errorText(o)}finally{this.busy=!1,this.render()}}else if(i==="undo"&&this.undo){this.busy=!0,this.render();try{this.schedules=await this.api.save(P(this.undo.before),this.undo.after),this.refreshCalendar(),this.message="Die letzte \xC4nderung wurde r\xFCckg\xE4ngig gemacht.",this.undo=void 0}catch(r){this.error=this.errorText(r)}finally{this.busy=!1,this.render()}}else if(i==="delete"){let r=this.schedules.find(o=>o.schedule_id===s);r&&(this.deletion={schedule:structuredClone(r),error:""},this.render(),this.focusDialog())}else if(i==="confirm-delete"&&this.deletion){this.busy=!0,this.render();try{this.schedules=await this.api.remove(this.deletion.schedule),this.deletion=void 0,this.undo=void 0,this.message="Der Heizplan wurde gel\xF6scht."}catch(r){this.deletion.error=this.errorText(r)}finally{this.busy=!1,this.render(),this.deletion||this.focusTrigger()}}else if(i==="quick"){let r=this.selected();this.quick={value:Number(r.state.attributes.temperature)||20,mode:r.state.state==="off"?"off":"heat",error:""},this.render(),this.focusDialog()}else if(i==="quick-mode"&&this.quick)this.quick.mode=t.dataset.mode==="off"?"off":"heat",this.render();else if(i==="quick-step"&&this.quick){let r=T(this.hass,this.room);this.quick.value=Number(Math.max(r.min,Math.min(r.max,(this.quick.value||r.min)+Number(t.dataset.delta)*r.step)).toFixed(3)),this.render()}else if(i==="quick-save"&&this.quick){let r=T(this.hass,this.room),o=this.quick.value;if(this.quick.mode==="heat"&&(!Number.isFinite(o)||o<r.min||o>r.max||Math.abs(o/r.step-Math.round(o/r.step))>1e-5)){this.quick.error=`Bitte w\xE4hle ${v(r.min)} bis ${v(r.max)} ${this.unit()} in Schritten von ${v(r.step)}.`,this.render();return}this.busy=!0,this.render();try{if(this.quick.mode==="off"){if(!z(this.hass,this.room,"off"))throw new Error("Dieses Thermostat unterst\xFCtzt den Aus-Modus nicht.");await this.hass.callService("climate","set_hvac_mode",{entity_id:this.room,hvac_mode:"off"}),this.message="Der Ausschaltbefehl wurde an das Thermostat gesendet."}else{if(this.hass.states[this.room]?.state==="off"&&!z(this.hass,this.room,"heat"))throw new Error("Dieses Thermostat unterst\xFCtzt keinen direkten Heizmodus.");await this.hass.callService("climate","set_temperature",{entity_id:this.room,temperature:o,...z(this.hass,this.room,"heat")?{hvac_mode:"heat"}:{}}),this.message="Die gew\xFCnschte Temperatur wurde an das Thermostat gesendet."}this.quick=void 0}catch(d){this.quick.error=this.errorText(d)}finally{this.busy=!1,this.render()}}}},te=class extends HTMLElement{root=this.attachShadow({mode:"open"});config={type:"custom:heatingplan-card"};state;roomSignature="";constructor(){super(),this.root.addEventListener("change",e=>this.handleChange(e))}setConfig(e){let t=e.title!==this.config.title;this.config={...e,...e.entities?{entities:[...e.entities]}:{}},this.update(t)}set hass(e){this.state=e,this.update()}connectedCallback(){this.update(!0)}update(e=!1){this.root.querySelector("section")||(this.root.innerHTML='<style>:host{display:block;font:inherit}label{display:block;margin:12px 0}input[type=text]{display:block;width:100%;box-sizing:border-box;padding:12px;border:1px solid var(--divider-color,#ccc);border-radius:8px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#222)}.rooms{max-height:300px;overflow:auto}p{color:var(--secondary-text-color,#666);font-size:13px}input[type=checkbox]{margin-right:10px}</style><section><label>Titel<input type="text" id="title"></label><label><input type="checkbox" id="all">Alle Thermostate anzeigen</label><div class="rooms"></div><p>W\xE4hle vorzugsweise die Better-Thermostat-Entit\xE4ten aus, damit jeder Raum nur einmal erscheint. Die Scheduler-Integration muss installiert sein.</p></section>',e=!0),e&&(this.root.querySelector("#title").value=this.config.title||"Heizplan");let t=this.state?A(this.state):[],i=JSON.stringify(t.map(n=>[n.id,n.name,n.detail])),s=this.root.querySelector(".rooms");if(i!==this.roomSignature){let n=s.scrollTop,r=this.root.activeElement?.dataset.id,o=this.ownerDocument.createDocumentFragment();for(let d of t){let h=this.ownerDocument.createElement("label"),u=this.ownerDocument.createElement("input");u.type="checkbox",u.dataset.id=d.id,h.append(u,this.ownerDocument.createTextNode(`${d.name} \xB7 ${d.detail}`)),o.append(h)}s.replaceChildren(o),this.roomSignature=i,this.syncSelection(),r&&[...s.querySelectorAll("input")].find(d=>d.dataset.id===r)?.focus({preventScroll:!0}),s.scrollTop=n}else this.syncSelection()}syncSelection(){let e=this.config.entities===void 0;this.root.querySelector("#all").checked=e;for(let t of this.root.querySelectorAll("[data-id]"))t.checked=e||this.config.entities.includes(t.dataset.id),t.disabled=e}handleChange(e){let t=e.target;if(t.id==="title")this.config.title=t.value;else if(t.id==="all")t.checked?delete this.config.entities:this.config.entities=this.state?A(this.state).map(i=>i.id):[];else if(t.dataset.id){let i=new Set(this.config.entities||[]);t.checked?i.add(t.dataset.id):i.delete(t.dataset.id),this.config.entities=[...i]}else return;this.syncSelection(),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:{...this.config,...this.config.entities?{entities:[...this.config.entities]}:{}}},bubbles:!0,composed:!0}))}};customElements.define("heatingplan-card",ee);customElements.define("heatingplan-card-editor",te);var we=window;we.customCards??=[];we.customCards.push({type:"heatingplan-card",name:"Heating Plan Card",description:"Heizpl\xE4ne einfach gestalten \u2013 f\xFCr Handy und Desktop.",preview:!0});console.info("Heating Plan Card 1.4.2");})();
