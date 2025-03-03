import { Vite } from '@sys/driver-vite';
import { c, Fs, PATHS, pkg, Semver } from './common.ts';

const resolve = (...parts: string[]) => Fs.join(import.meta.dirname ?? '', '..', ...parts);
await Fs.remove(resolve('.tmp'));

/**
 * Update to latest dependency versions.
 */
await Vite.Tmpl.prep();

/**
 * Bundle files inline, base64-string FileMap (NB: so code can be referenfed within the registry).
 */
const bundle = Vite.Tmpl.Bundle;
await bundle.toFilemap();
await bundle.writeToFile(resolve(PATHS.tmpl.tmp)); // NB: test output.

const fmtVersion = Semver.Fmt.colorize(pkg.version);
const fmtModule = `${pkg.name}${c.dim('@')}${fmtVersion}`;
console.info(c.brightCyan('↑ Prep Complete:'), fmtModule);
console.info();
