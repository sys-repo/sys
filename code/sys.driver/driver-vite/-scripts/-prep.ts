import { Vite } from '@sys/driver-vite';
import { Fs, PATHS, c, getWorkspaceModules, pkg } from './common.ts';

const resolve = (...parts: string[]) => Fs.join(import.meta.dirname ?? '', '..', ...parts);
await Fs.remove(resolve('.tmp'));

/**
 * Save latest dependency versions.
 */
async function updateDenoImports() {
  type O = Record<string, string>;
  const { modules } = await getWorkspaceModules();
  const path = './src/-tmpl/imports.json';
  const imports = (await Fs.readJson<O>(path)).data;
  await Fs.writeJson(path, modules.latest(imports ?? {}));
}

await updateDenoImports();

/**
 * Bundle files (for code-registry).
 */
const bundle = Vite.Tmpl.Bundle;
await bundle.toFilemap();
await bundle.writeToFile(resolve(PATHS.tmpl.tmp)); // NB: test output.

console.info(c.brightCyan('↑ Prep Complete:'), `${pkg.name}@${c.brightCyan(pkg.version)}`);
console.info();
