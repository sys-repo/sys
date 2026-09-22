import { Vite } from '@sys/driver-vite';
import { BUILD_BASE_ENV } from '../vite.config.ts';
import { readData } from '../src/m.app/u.data.ts';
import { configFrom } from '../src/m.app/u.selection.ts';
import { Fs, pkg, ROOT } from './common.ts';
import { buildSample } from './u.build.ts';
import { formatBuildSelection } from './u.fmt.ts';

/** Build once, then select the two verified publication inventories. No credentials are resolved. */
const config = configFrom(await readData(Fs.Path.toFileUrl(Fs.join(ROOT, 'r2.config.json'))));
const result = await buildSample(config, ROOT, async ({ root, publicAssetBase }) => {
  // This executable owns its process environment. Both Vite config evaluations read one capture,
  // not r2.config.json again; no generated configuration file or alternate builder is involved.
  const previous = Deno.env.get(BUILD_BASE_ENV);
  Deno.env.set(BUILD_BASE_ENV, publicAssetBase);
  try {
    return await Vite.build({ cwd: root, pkg, exitOnError: false });
  } finally {
    if (previous === undefined) Deno.env.delete(BUILD_BASE_ENV);
    else Deno.env.set(BUILD_BASE_ENV, previous);
  }
});
console.info(result.build.toString());
console.info();
console.info(formatBuildSelection(result.buildRecord.selection));
console.info();
