import { c } from '@sys/color/ansi';
import { Vite } from '@sys/driver-vite';
import { Fs } from '@sys/fs';
import { PATHS, pkg } from '../src/common.ts';

const resolve = (...parts: string[]) => Fs.join(import.meta.dirname ?? '', '..', ...parts);
await Fs.remove(resolve('.tmp'));

const bundle = Vite.Tmpl.Bundle;
await bundle.toFilemap();
await bundle.writeToFile(resolve(PATHS.tmpl.tmp)); // NB: test output.

console.info(c.brightCyan('Prep Complete:'), `${pkg.name}@${c.brightCyan(pkg.version)}`);
console.info();
