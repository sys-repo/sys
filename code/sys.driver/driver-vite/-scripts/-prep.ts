import { Vite } from '@sys/driver-vite';
import { Fs, PATHS, c, pkg } from './common.ts';

const resolve = (...parts: string[]) => Fs.join(import.meta.dirname ?? '', '..', ...parts);
await Fs.remove(resolve('.tmp'));

const bundle = Vite.Tmpl.Bundle;
await bundle.toFilemap();
await bundle.writeToFile(resolve(PATHS.tmpl.tmp)); // NB: test output.

console.info(c.brightCyan('↑ Prep Complete:'), `${pkg.name}@${c.brightCyan(pkg.version)}`);
console.info();
