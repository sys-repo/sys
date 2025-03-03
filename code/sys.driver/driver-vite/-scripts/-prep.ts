import { Vite } from '@sys/driver-vite';
import { c, Fs, PATHS, pkg, Semver } from './common.ts';

const resolve = (...parts: string[]) => Fs.join(import.meta.dirname ?? '', '..', ...parts);
await Fs.remove(resolve('.tmp'));

/**
 * Save latest dependency versions.
 */
await Vite.Tmpl.prep();

/**
 * Bundle files (for code-registry).
 */
const bundle = Vite.Tmpl.Bundle;
await bundle.toFilemap();
await bundle.writeToFile(resolve(PATHS.tmpl.tmp)); // NB: test output.

const version = Semver.Fmt.colorize(pkg.version);
console.info(c.brightCyan('↑ Prep Complete:'), `${pkg.name}${c.dim('@')}${version}`);
console.info();
