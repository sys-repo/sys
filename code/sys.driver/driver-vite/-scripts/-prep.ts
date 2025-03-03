import { Vite } from '@sys/driver-vite';
import { Fs, PATHS, c, pkg, Cli, Esm, Semver } from './common.ts';
import { trimStart } from 'valibot';

const resolve = (...parts: string[]) => Fs.join(import.meta.dirname ?? '', '..', ...parts);
await Fs.remove(resolve('.tmp'));

/**
 * Save latest dependency versions.
 */
const { imports } = await Vite.Tmpl.prep();

const table = Cli.table([]);
Object.entries(imports).forEach(([key, value]) => {
  const m = Esm.parse(value);
  const pkg = c.gray(`  ${key}`);
  const registry = c.gray(m.registry.toUpperCase());
  const version = Semver.Fmt.colorize(m.version);
  table.push([pkg, version, registry]);
});

console.info();
console.info(c.italic(c.gray('imports.json')));
console.info(c.brightCyan(`Dependencies:`));
console.info(table.toString());
console.info();

/**
 * Bundle files (for code-registry).
 */
const bundle = Vite.Tmpl.Bundle;
await bundle.toFilemap();
await bundle.writeToFile(resolve(PATHS.tmpl.tmp)); // NB: test output.

console.info(c.brightCyan('↑ Prep Complete:'), `${pkg.name}@${c.brightCyan(pkg.version)}`);
console.info();
