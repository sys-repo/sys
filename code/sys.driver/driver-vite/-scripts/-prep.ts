import { c } from '@sys/color/ansi';
import { Vite } from '@sys/driver-vite';
import { Fs } from '@sys/fs';
import { pkg } from '../src/pkg.ts';

const Bundle = Vite.Tmpl.Bundle;
await Fs.remove('./.tmp');

await Bundle.toFilemap();
await Bundle.toFilesystem(); // NB: test output

console.info(c.brightCyan('Prep Complete:'), `${pkg.name}@${c.brightCyan(pkg.version)}`);
console.info();
