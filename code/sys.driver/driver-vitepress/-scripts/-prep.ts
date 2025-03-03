import { Vitepress } from '@sys/driver-vitepress';
import { c, Fs, PATHS, pkg, Semver } from './common.ts';

const resolve = (...parts: string[]) => Fs.join(import.meta.dirname ?? '', '..', ...parts);
await Fs.remove(resolve('.tmp'));

/**
 * Update to latest dependency versions.
 */
await Vitepress.Tmpl.prep();

/**
 * Bundle files inline, base64-string FileMap (NB: so code can be referenfed within the registry).
 */
const Bundle = Vitepress.Tmpl.Bundle;
await Bundle.toFilemap();
await Bundle.toFilesystem(resolve(PATHS.tmpl.tmp)); // NB: test output.

const fmtVersion = Semver.Fmt.colorize(pkg.version);
const fmtModule = `${pkg.name}${c.dim('@')}${fmtVersion}`;
console.info(c.brightCyan('↑ Prep Complete:'), fmtModule);
console.info();
