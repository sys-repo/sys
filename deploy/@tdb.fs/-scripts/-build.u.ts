import { Cli, c } from '@sys/cli';
import { DenoFile } from '@sys/driver-deno/runtime';
import { Fs, Path } from '@sys/fs';
import { Process } from '@sys/process';
import { type t } from './common.ts';

type Options = { build?: boolean; exitOnError?: boolean };

/**
 * Ensure dist.
 */
await Fs.ensureDir('./dist');

export async function buildAndCopyAll(all: Parameters<typeof buildAndCopy>[]) {
  const table = Cli.table([]);
  table.push([c.gray('Packages:')]);
  table.push([c.gray('  │ ')]);

  let i = -1;
  for (const [moduleDir, targetDir, options] of all) {
    i++;
    const isLast = i === all.length - 1;
    const bullet = isLast ? '  └── ' : '  ├── ';

    const denofile = (await DenoFile.load(moduleDir)).data;
    const pkg = c.green(denofile?.name ?? '<unnamed>');
    const input = `${c.gray(bullet)}${c.gray(moduleDir)}`;
    const out = c.cyan(targetDir);

    table.push([input, pkg, out]);
  }

  console.info(table.toString().trim());
  console.info();

  for (const [moduleDir, targetDir, options] of all) {
    await buildAndCopy(moduleDir, targetDir, options);
  }
}

/**
 * Build project(s).
 */
export async function buildAndCopy(
  moduleDir: t.StringDir,
  targetDir: t.StringRelativeDir,
  options: Options = {},
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
   * Build:
   */
  let stderr: string | undefined;

  if (options.build ?? true) {
    // Run build command:
    const pkg: t.Pkg = { name: denofile.name ?? 'Unnamed', version: denofile.version ?? '0.0.0' };
    let label = c.gray(`building: ${c.green(pkg.name)} → ${c.cyan(`/${targetDir}`)}`);
    const spinner = Cli.spinner(label + '\n');
    const res = await sh.run('deno -q task test && deno -q task build');
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

/**
 * Copy in the `public/static` assets to the dist folder.
 */
export async function copyPublic(sourceDir: t.StringDir, targetDir: t.StringRelativeDir) {
  const glob = Fs.glob(sourceDir);
  const dirs = await glob.find('*/');
  for (const dir of dirs) {
    await Fs.copy(dir.path, Fs.join(targetDir, dir.name), { force: true });
  }
}
