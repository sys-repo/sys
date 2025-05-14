import { type t, pkg } from './common.ts';
import { Cli, c } from '@sys/cli';
import { Process } from '@sys/process';
import { Fs, Path, Pkg } from '@sys/fs';
import { DenoFile } from '@sys/driver-deno/runtime';

/**
 * Ensure dist.
 */
await Fs.ensureDir('./dist');

/**
 * Build project(s).
 */
async function buildAndCopy(moduleDir: t.StringDir, targetDir: t.StringRelativeDir) {
  const path = Fs.resolve(moduleDir);
  const silent = true;
  const sh = Process.sh({ path, silent });

  const denofile = (await DenoFile.load(path)).data;
  if (!denofile) {
    throw new Error(`Failed to load deno.json from: ${path}`);
  }

  let label = c.gray(`building: ${c.green(denofile.name ?? 'Unnamed')} → ${c.green(targetDir)}`);
  const spinner = Cli.spinner(label);
  const res = await sh.run('deno task build');
  spinner.stop();

  if (!res.success) {
    console.info(res.text.stderr);
    console.info();
    console.error(`Failed while building: ${path}`);
  }

  /**
   * Copy build to local /dist.
   */
  await Fs.copy(Path.join(path, 'dist'), Path.resolve('dist', targetDir));
}

console.info();
await buildAndCopy('../../code/sys.ui/ui-react-components', 'ui');
await buildAndCopy('../../code/sys.driver/driver-monaco', 'ui.driver.monaco');

/**
 * Calculate [PkgDist].
 */
await Fs.remove('dist/dist.json');
await Pkg.Dist.compute({ dir: 'dist', pkg, save: true });

// Finish.
Deno.exit(0);
