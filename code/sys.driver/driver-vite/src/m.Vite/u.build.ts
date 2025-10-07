import { type t, pkg as builder, c, Cli, CompositeHash, Fs, Pkg, Process, Time } from './common.ts';
import { Log, Wrangle } from './u.ts';

type B = t.ViteLib['build'];

/**
 * Run the <vite:build> command.
 */
export const build: B = async (input) => {
  const timer = Time.timer();
  const paths = await Wrangle.pathsFromConfigfile(input.cwd);
  const { pkg, silent = false, spinner: useSpinner = true, exitOnError = true } = input;
  const { cmd, args } = await Wrangle.command(paths, 'build');
  const dir = Fs.join(paths.cwd, paths.app.outDir);
  const cwd = paths.cwd;

  /**
   * Helpers:
   */
  const clean = async (dir: t.StringPath) => {
    const remove = async (pattern: string) => {
      const paths = await Fs.glob(dir).find(pattern);
      for (const p of paths) await Fs.remove(p.path, { log: false });
    };
    await remove('**/.DS_Store');
  };

  const computeDist = async (entry: string, save: boolean) => {
    const res = await Pkg.Dist.compute({ dir, pkg, builder, entry, save });
    return res.dist;
  };

  type R = t.ViteBuildResponse;
  type RArgs = { ok: boolean; output: t.ProcOutput; elapsed: t.Msecs; dist: t.DistPkg };
  const response = (args: RArgs): R => {
    const { ok, output, elapsed, dist } = args;
    const stdio = output.toString();
    return {
      ok,
      paths,
      elapsed,
      dist,
      get cmd() {
        return { input: cmd, output };
      },
      toString(options = {}) {
        const { pad } = options as { pad?: boolean };
        const totalSize = dist?.build?.size?.total ?? { files: 0, bytes: 0 };
        const hash = dist?.hash?.digest ?? '';
        return Log.Build.toString({
          ok,
          stdio,
          dirs: { in: paths.app.entry, out: paths.app.outDir },
          totalSize,
          pkg,
          pkgSize: CompositeHash.size(dist.hash.parts, (e) => Pkg.Dist.Is.codePath(e.path)),
          hash,
          pad,
          elapsed,
        });
      },
    };
  };

  const fail = async (message: string, output: t.ProcOutput) => {
    const errInfo = {
      cmd,
      code: output.code,
      stderr: output.text.stderr,
      stdout: output.text.stdout,
    };
    const dist = await computeDist('', false);
    const res = response({ ok: false, output, elapsed: timer.elapsed.msec, dist });

    console.error(message);
    if (errInfo.stderr?.trim()) console.error(errInfo.stderr.trim());
    if (!errInfo.stderr?.trim() && errInfo.stdout?.trim()) console.error(errInfo.stdout.trim());

    if (exitOnError) Deno.exit(1);
    return res;
  };

  /**
   * Logging (paths):
   */
  if (!silent) {
    const table = Cli.table([]);
    const push = (label: string, ...value: string[]) => table.push([c.gray(label), ...value]);
    push('Directory:', c.gray(`${cwd.replace(/\/$/, '')}/`));
    push('  • entry:', wrangle.cleanPath(paths.app.entry));
    push('  • outDir:', wrangle.cleanPath(paths.app.outDir) + '/');
    push('  • base:', wrangle.cleanPath(paths.app.base) + '/');
    console.info(c.bold(c.brightGreen('Paths')));
    console.info(table.toString().trim());
    console.info();
  }

  const spinner = Cli.Spinner.create('building', { silent, start: false });
  if (useSpinner && !silent) spinner.start();

  /**
   * Run vite (CLI):
   */
  const output = await Process.invoke({ cwd, args, silent: true });
  const ok = output.success;

  if (!ok) {
    spinner.stop();
    return await fail('Vite build failed (non-zero exit)', output);
  }

  if (pkg) {
    const path = Fs.join(dir, 'pkg', '-pkg.json');
    await Fs.ensureDir(Fs.dirname(path));
    await Deno.writeTextFile(path, JSON.stringify(pkg, null, '  '));
  }

  await clean(paths.app.outDir);

  /**
   * Assert non-empty dist after apparent success:
   */
  const size = await Fs.Size.dir(dir, { maxDepth: 2 });
  if (!size.exists || size.total.files === 0) {
    spinner.stop();
    return await fail(`Vite build produced no artifacts at ${dir}`, output);
  }

  /**
   * Success:
   */
  const entry = await wrangle.entryPath(dir);
  const elapsed = timer.elapsed.msec;
  const dist = await computeDist(entry, true);
  const res = response({ ok: true, output, elapsed, dist });

  spinner.stop();
  return res;
};

/**
 * Helpers:
 */
const wrangle = {
  async entryPath(dist: t.StringDir) {
    const paths = await Fs.glob(dist).find('pkg/-entry.*');
    const filename = paths[0]?.name ?? '';
    return filename ? `./pkg/${filename}` : '';
  },

  cleanPath(input: t.StringPath = '') {
    return input
      .trim()
      .replace(/^(?:\.\/)+/, '') //   ← strip any leading "./" segments.
      .replace(/\/+$/, ''); //        ← strip any trailing "/" characters.
  },
} as const;
