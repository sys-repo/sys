import { Cli, c } from '@sys/cli';
import { DenoFile } from '@sys/driver-deno/runtime';
import { Fs, Path } from '@sys/fs';
import { Process } from '@sys/process';
import { type t } from './common.ts';

/**
 * Ensure dist.
 */
await Fs.ensureDir('./dist');

/**
 * Build project(s).
 */
export async function buildAndCopy(
  moduleDir: t.StringDir,
  targetDir: t.StringRelativeDir,
  options: { build?: boolean } = {},
) {
  const path = Fs.resolve(moduleDir);
  const silent = true;
  const sh = Process.sh({ path, silent });

  const denofile = (await DenoFile.load(path)).data;
  if (!denofile) {
    throw new Error(`Failed to load deno.json from: ${path}`);
  }

  /**
   * Build
   */
  if (options.build ?? true) {
    const pkg: t.Pkg = { name: denofile.name ?? 'Unnamed', version: denofile.version ?? '0.0.0' };
    let label = c.gray(`building: ${c.green(pkg.name)} → ${c.cyan(`/${targetDir}`)}`);
    const spinner = Cli.spinner(label);
    const res = await sh.run('deno task test && deno task build');
    spinner.stop();

    if (!res.success) {
      console.info(res.text.stderr);
      console.info();
      console.error(`Failed while building: ${path}`);
    }
  }

  /**
   * Copy build to local /dist.
   */
  await Fs.copy(Path.join(path, 'dist'), Path.resolve('dist', targetDir), { force: true });
}
