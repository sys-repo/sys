import { DenoDeps, DenoFile } from '@sys/driver-deno/runtime';
import { Dep } from '@sys/driver-deno/t';
import { Vitepress } from '@sys/driver-vitepress';
import { Fs } from '@sys/fs';

/**
 * Save monorepo deps.
 */
const ws = await DenoFile.workspace();
const deps: Dep[] = ws.modules.items.map((m) => DenoDeps.toDep(m));
const yaml = DenoDeps.toYaml(deps);

const dir = './src/-tmpl/.sys';
await Fs.copy(Fs.join(ws.dir, 'deps.yaml'), Fs.join(dir, 'deps.yaml'));
await Fs.write(Fs.join(dir, 'deps.sys.yaml'), yaml.text);

/**
 * Bundle files (for code-registry).
 */
const Bundle = Vitepress.Tmpl.Bundle;
await Bundle.toFilemap();
await Bundle.toFilesystem(); // NB: test output.
