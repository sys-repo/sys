import { Vite } from '@sys/driver-vite';
import { APP_ENTRY } from '../vite.config.ts';
import { readData } from '../src/m.app/u.data.ts';
import { configFrom } from '../src/m.app/u.selection.ts';
import { Fs, pkg, ROOT } from './common.ts';
import { buildSample } from './u.build.ts';
import { formatBuildSelection } from './u.fmt.ts';

/**
 * Build the UI once, then create verified public and private outputs.
 * No R2 credentials are needed.
 */
const config = configFrom(await readData(Fs.Path.toFileUrl(Fs.join(ROOT, 'r2.config.json'))));
const result = await buildSample(config, ROOT, async ({ root, publicAssetBase }) => {
  const paths = Vite.Config.paths({ cwd: root, app: { entry: APP_ENTRY, base: publicAssetBase } });
  return await Vite.build({ cwd: root, paths, pkg, exitOnError: false });
});
console.info(result.build.toString());
console.info();
console.info(formatBuildSelection(result.buildRecord.selection));
console.info();
