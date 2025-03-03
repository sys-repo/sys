import { Vitepress } from '@sys/driver-vitepress';
import { c, Fs, PATHS, pkg, Semver } from './common.ts';

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

const fmtVersion = Semver.Fmt.colorize(pkg.version);
const fmtModule = `${pkg.name}${c.dim('@')}${fmtVersion}`;
console.info(c.brightCyan('↑ Prep Complete:'), fmtModule);
console.info();
