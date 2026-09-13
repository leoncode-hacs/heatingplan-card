import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
await build({
  entryPoints: ['src/card.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2022',
  outfile: 'dist/heatingplan-card.js',
  minify: true,
  banner: {
    js: `/*! Heating Plan Card v${version} | Copyright 2026 Heating Plan Card contributors | SPDX-License-Identifier: GPL-3.0-only | Source: https://github.com/leoncode-hacs/heatingplan-card */`,
  },
  legalComments: 'eof',
  define: { __VERSION__: JSON.stringify(version) },
});
