import {
  c,
  Cli,
  CompositeHash,
  Err,
  Fs,
  Json,
  Path,
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
type R = t.Vite.Build.Response;
type Success = Extract<R, { ok: true }>;
type RArgs = {
  output: t.Process.Output;
  elapsed: t.Msecs;
} & ({ ok: false; error: t.StdError } | Pick<Success, 'ok' | 'dist' | 'pin' | 'manifestChecksum'>);

/**
 * Run the <vite:build> command.
 */
export const build: B = (input) => buildWith(input);

/** Internal producer seams; successful child output remains independent of producer refusal. */
export async function buildWith(
  input: t.Vite.Build.Args,
  writePackage: typeof Fs.write = Fs.write,
  compute: typeof Pkg.Dist.compute = Pkg.Dist.compute,
): Promise<R> {
  const timer = Time.timer();
  const dependencyPolicy = input.dependencyPolicy;
  const paths = snapshotPaths(input.paths ?? (await Wrangle.pathsFromConfigfile(input.cwd)));
  const { pkg, silent = false, spinner: useSpinner = true, exitOnError = true } = input;
  const { cmd, args, env, dispose } = await Wrangle.command(paths, 'build', dependencyPolicy);
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
    return await compute({ dir, pkg, builder, save });
  };

  const response = (args: RArgs): R => {
    const { ok, output, elapsed } = args;
    const dist = args.ok ? args.dist : undefined;
    const authority = args.ok
      ? {
        ok: true as const,
        dist: args.dist,
        pin: args.pin,
        manifestChecksum: args.manifestChecksum,
      }
      : { ok: false as const, error: args.error };
    const stdio = output.toString();
    return {
      ...authority,
      paths,
      elapsed,
      get cmd() {
        return { input: cmd, output };
      },
      toString(options: t.Vite.Build.ToStringOptions = {}) {
        const { pad, width } = options;
        const totalSize = dist?.build?.size?.total ?? 0;
        const hash = dist?.hash?.digest ?? '';
        return Log.Build.toString({
          ok,
          stdio,
          ...(args.ok ? {} : { error: args.error }),
          dirs: { in: paths.app.entry, out: paths.app.outDir },
          totalSize,
          pkg,
          pkgSize: dist
            ? CompositeHash.size(dist.hash.parts, (e) => Pkg.Dist.Is.codePath(e.path))
            : 0,
          hash,
          manifestUrl: ok ? Path.toFileUrl(Fs.join(dir, 'dist.json')) : undefined,
          pad,
          elapsed,
          width,
        });
      },
    };
  };

  const fail = (message: string, output: t.Process.Output, cause?: t.StdError) => {
    const error = Err.std(message, { cause });
    const { stderr, stdout } = output.text;
    const res = response({ ok: false, error, output, elapsed: timer.elapsed.msec });

    console.error(Err.summary(error, { cause: true }));
    if (stderr?.trim()) console.error(stderr.trim());
    if (!stderr?.trim() && stdout?.trim()) console.error(stdout.trim());

    if (exitOnError) Deno.exit(1);
    return res;
  };

  /**
   * Logging (paths):
   */
  if (!silent) {
    console.info();
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
      const written = await writePackage(path, Json.stringify(pkg, 2));
      if (written.error) {
        return await fail('Vite build failed to write package declaration', output, written.error);
      }
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
     * Compute and save Dist metadata before reporting producer success:
     */
    const elapsed = timer.elapsed.msec;
    const computed = await computeDist(true);
    if (computed.kind !== 'computed') {
      return await fail('Vite build failed to compute dist metadata', output, computed.error);
    }
    return response({
      ok: true,
      output,
      elapsed,
      dist: computed.dist,
      pin: computed.pin,
      manifestChecksum: computed.manifestChecksum,
    });
  } finally {
    stopSpinner();
    await dispose();
  }
}

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
