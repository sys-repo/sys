import {
  c,
  Cli,
  CompositeHash,
  Fs,
  Json,
  Pkg,
  pkg as builder,
  Process,
  type t,
  Time,
} from '../common.ts';
import { ViteLog } from '../../m.fmt/mod.ts';
import { Log } from './u.log.ts';
import { Wrangle } from './u.wrangle.ts';

type B = t.Vite.Lib['build'];

/**
 * Run the <vite:build> command.
 */
export const build: B = async (input) => {
  const timer = Time.timer();
  const paths = snapshotPaths(input.paths ?? (await Wrangle.pathsFromConfigfile(input.cwd)));
  const { pkg, silent = false, spinner: useSpinner = true, exitOnError = true } = input;
  const { cmd, args, env, dispose } = await Wrangle.command(paths, 'build');
  const dir = Fs.resolve(paths.cwd, paths.app.outDir);
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

  const computeDist = async (save: boolean) => {
    return await Pkg.Dist.compute({ dir, pkg, builder, save });
  };

  type R = t.Vite.Build.Response;
  type RArgs = {
    ok: boolean;
    output: t.Process.Output;
    elapsed: t.Msecs;
    dist: t.DistPkg;
    manifest: t.Vite.Build.Manifest;
  };
  const response = (args: RArgs): R => {
    const { ok, output, elapsed, dist, manifest } = args;
    const stdio = output.toString();
    return {
      ok,
      paths,
      elapsed,
      dist,
      manifest,
      get cmd() {
        return { input: cmd, output };
      },
      toString(options = {}) {
        const { pad, width } = options;
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
          width,
        });
      },
    };
  };

  const fail = async (message: string, output: t.Process.Output) => {
    const errInfo = {
      cmd,
      code: output.code,
      stderr: output.text.stderr,
      stdout: output.text.stdout,
    };
    const computed = await computeDist(false);
    const res = response({
      ok: false,
      output,
      elapsed: timer.elapsed.msec,
      dist: computed.dist,
      manifest: computed.manifest,
    });

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
    console.info(Log.Build.paths({ cwd, paths }));
    console.info();
  }

  const startedAt = Time.now.timestamp;
  const spinner = Cli.Spinner.create(wrangle.spinnerText('building', startedAt));
  const spinTimer = useSpinner && !silent
    ? Time.interval(1000, () => (spinner.text = wrangle.spinnerText('building', startedAt)))
    : undefined;
  if (useSpinner && !silent) spinner.start();

  const stopSpinner = () => {
    spinTimer?.cancel();
    spinner.stop();
  };

  try {
    /**
     * Run vite (CLI):
     */
    const output = await Process.invoke({ cwd, args, env, silent: true });
    const ok = output.success;

    if (!ok) {
      return await fail('Vite build failed (non-zero exit)', output);
    }

    if (pkg) {
      const path = Fs.join(dir, 'pkg', '-pkg.json');
      await Fs.ensureDir(Fs.dirname(path));
      await Fs.write(path, Json.stringify(pkg, 2));
    }

    await clean(dir);

    /**
     * Assert non-empty dist after apparent success:
     */
    const size = await Fs.Size.dir(dir, { maxDepth: 2 });
    if (!size.exists || size.total.files === 0) {
      return await fail(`Vite build produced no artifacts at ${dir}`, output);
    }

    /**
     * Success:
     */
    const elapsed = timer.elapsed.msec;
    const computed = await computeDist(true);
    if (computed.error) {
      return await fail('Vite build failed to compute dist metadata', output);
    }
    return response({
      ok: true,
      output,
      elapsed,
      dist: computed.dist,
      manifest: computed.manifest,
    });
  } finally {
    stopSpinner();
    await dispose();
  }
};

/**
 * Capture one immutable path authority before command construction yields to caller mutation.
 */
function snapshotPaths(input: t.ViteConfig.Paths): t.ViteConfig.Paths {
  const cwd = input.cwd;
  const source = input.app;
  const entry = source.entry;
  const sw = source.sw;
  const outDir = source.outDir;
  const base = source.base;
  const app = sw === undefined
    ? Object.freeze({ entry, outDir, base })
    : Object.freeze({ entry, sw, outDir, base });
  return Object.freeze({ cwd, app });
}

/**
 * Helpers:
 */
const wrangle = {
  spinnerText(label: string, startedAt: number) {
    const elapsed = Time.elapsed(startedAt);
    const suffix = elapsed.msec >= 1000 ? c.dim(c.gray(` ${ViteLog.elapsed(elapsed.msec)}`)) : '';
    return Cli.Fmt.spinnerText(`${label}${suffix}`);
  },
} as const;
