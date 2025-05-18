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
  options: { build?: boolean; exitOnError?: boolean } = {},
) {
  const { exitOnError = true } = options;
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
  let stderr: string | undefined;

  if (options.build ?? true) {
    const pkg: t.Pkg = { name: denofile.name ?? 'Unnamed', version: denofile.version ?? '0.0.0' };
    let label = c.gray(`building: ${c.green(pkg.name)} → ${c.cyan(`/${targetDir}`)}`);
    const spinner = Cli.spinner(label);
    const res = await sh.run('deno task test && deno task build');
    spinner.stop();

    if (!res.success) {
      stderr = res.text.stderr;
      console.info(stderr);
      console.info();
      console.info(c.yellow('─'.repeat(21)));
      console.error(`${c.red(c.bold('Failed'))} while building ${c.yellow(pkg.name)}\n`);
      if (exitOnError) Deno.exit(1);
    }
  }

  /**
   * Copy build to local /dist.
   */
  const dir = {
    src: Path.join(path, 'dist'),
    target: targetDir,
  };
  await Fs.copy(dir.src, Path.resolve('dist', dir.target), { force: true });

  // Finish up.
  return {
    ok: !stderr,
    dir,
    stderr,
  } as const;
}
