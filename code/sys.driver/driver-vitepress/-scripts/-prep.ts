import { Vitepress } from '@sys/driver-vitepress';
import { c, DenoDeps, DenoFile, Fs, PATHS, pkg, type t } from './u.ts';

const resolve = (...parts: string[]) => Fs.join(import.meta.dirname ?? '', '..', ...parts);
const tmp = resolve('.tmp');
await Fs.remove(tmp);

/**
 * Save monorepo deps.
 */
const ws = await DenoFile.workspace();
const deps: t.Dep[] = ws.modules.items.map((m) => DenoDeps.toDep(m));
const yaml = DenoDeps.toYaml(deps);

const dir = resolve('src/-tmpl/.sys');
await Fs.copy(Fs.join(ws.dir, 'deps.yaml'), Fs.join(dir, 'deps.yaml'), { force: true });
await Fs.write(Fs.join(dir, 'deps.sys.yaml'), yaml.text);

/**
 * Bundle files (for code-registry).
 */
const Bundle = Vitepress.Tmpl.Bundle;
await Bundle.toFilemap();
await Bundle.toFilesystem(resolve(PATHS.tmpl.tmp)); // NB: test output.

console.info(c.brightCyan('↑ Prep Complete:'), `${pkg.name}@${c.brightCyan(pkg.version)}`);
console.info();
