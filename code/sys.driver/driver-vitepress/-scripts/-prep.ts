import { Vitepress } from '@sys/driver-vitepress';
import { type t, c, DenoDeps, DenoFile, Fs, PATHS, pkg } from './common.ts';

const resolve = (...parts: string[]) => Fs.join(import.meta.dirname ?? '', '..', ...parts);
await Fs.remove(resolve('.tmp'));

/**
 * Save monorepo deps.
 */
const ws = await DenoFile.workspace();
const deps: t.Dep[] = ws.modules.items.map((esm) => DenoDeps.toDep(esm));

const dir = resolve('src/-tmpl/.sys');
await Fs.copy(Fs.join(ws.dir, 'deps.yaml'), Fs.join(dir, 'deps.yaml'), { force: true });
await Fs.write(Fs.join(dir, 'deps.sys.yaml'), DenoDeps.toYaml(deps).text);

/**
 * Bundle files (for code-registry).
 */
const Bundle = Vitepress.Tmpl.Bundle;
await Bundle.toFilemap();
await Bundle.toFilesystem(resolve(PATHS.tmpl.tmp)); // NB: test output.

console.info(c.brightCyan('↑ Prep Complete:'), `${pkg.name}@${c.brightCyan(pkg.version)}`);
console.info();
