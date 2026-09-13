# Provenance

Heating Plan Card was independently implemented for this repository in September
2026. Its own source, SVG line icons, layout, demo fixtures, tests and build
scripts were authored specifically for this project. No files or source code
were copied from Scheduler Card or the earlier LeonCode Scheduler Card fork.

The desired functionality was informed by the user's requirements and prior
product discussion. Protocol interoperability was checked using Scheduler's
published service documentation and the externally observable/API contracts
of its backend. Backend source was consulted to resolve protocol details such
as accepted time strings, readback defaults and REST response types; no backend
implementation is included in this project.

Protocol references:

- https://github.com/nielsfaber/scheduler-component#services
- https://github.com/nielsfaber/scheduler-component/blob/main/custom_components/scheduler/websockets.py
- https://github.com/nielsfaber/scheduler-component/blob/main/custom_components/scheduler/const.py
- https://github.com/nielsfaber/scheduler-component/blob/main/custom_components/scheduler/store.py
- https://github.com/nielsfaber/scheduler-component/blob/main/custom_components/scheduler/timer.py
- https://www.hacs.xyz/docs/publish/plugin/

The project deliberately uses native Web Components rather than importing
runtime UI code. TypeScript, esbuild, Happy DOM and Prettier are development/test
tools; they are installed from npm under their own licenses. `npm ls --omit=dev`
contains no runtime package dependencies.

The GPL v3 text in LICENSE was obtained from the Free Software Foundation at
https://www.gnu.org/licenses/gpl-3.0.txt. The project is licensed GPL-3.0-only at
the copyright holder's request, independently of any third-party card.
