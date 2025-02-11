import { c } from '@sys/color/ansi';
import { Vite } from '@sys/driver-vite';

const Bundle = Vite.Tmpl.Bundle;

import { pkg } from '../src/pkg.ts';

await Bundle.toFilemap();
await Bundle.toFilesystem(); // NB: test output

console.info(c.brightCyan('Prep Complete:'), `${pkg.name}@${c.brightCyan(pkg.version)}`);
console.info();
