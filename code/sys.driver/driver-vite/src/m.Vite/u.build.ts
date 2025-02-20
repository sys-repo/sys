import { type t, Fs, Pkg, Process, Time, ViteConfig } from './common.ts';
import { Log, Wrangle } from './u.ts';

type B = t.ViteLib['build'];

/**
 * Run the <vite:build> command.
 */
export const build: B = async (input) => {
  const timer = Time.timer();
  const paths = await wrangle.paths(input.cwd);
  const { pkg, silent = true } = input;
  const { cmd, args } = await Wrangle.command(paths, 'build');
  const dir = Fs.join(paths.cwd, paths.app.outDir);

  const output = await Process.invoke({ args, silent });
  const ok = output.success;

  if (pkg) {
    const path = Fs.join(dir, 'pkg', '-pkg.json');
    await Fs.ensureDir(Fs.dirname(path));
    await Deno.writeTextFile(path, JSON.stringify(pkg, null, '  '));
  }

  const entry = await wrangle.entryPath(dir);
  const dist = (await Pkg.Dist.compute({ dir, pkg, entry, save: true })).dist;
  const hash = dist.hash.digest;
  const elapsed = timer.elapsed.msec;

  const res: t.ViteBuildResponse = {
    ok,
    paths,
    elapsed,
    get dist() {
      return dist;
    },
    get cmd() {
      return { input: cmd, output };
    },
    toString(options = {}) {
      const { pad } = options;
      const stdio = output.toString();
      const bytes = dist.size.bytes;
      const dirs = { in: paths.app.entry, out: paths.app.outDir };
      return Log.Build.toString({ ok, stdio, dirs, pad, pkg, bytes, hash, elapsed });
    },
  };

  return res;
};

/**
 * Helpers
 */
const wrangle = {
  async paths(cwd?: t.StringDir) {
    const filename = 'vite.config.ts';
    const path = Fs.join(cwd || Fs.cwd(), filename);
    const res = await ViteConfig.fromFile(path);
    const paths = res.module.paths;
    if (!paths) throw new Error(`Failed to load paths from [${filename}]. Path: ${path}`);
    return paths;
  },

  async entryPath(dist: t.StringDir) {
    const paths = await Fs.glob(dist).find('pkg/-entry.*');
    const filename = paths[0]?.name ?? '';
    return filename ? `./pkg/${filename}` : '';
  },
} as const;
