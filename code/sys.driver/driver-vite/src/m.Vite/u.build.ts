import { type t, Fs, Pkg, Process, Time } from './common.ts';
import { Log, Wrangle } from './u.ts';

type B = t.ViteLib['build'];

/**
 * Run the <vite:build> command.
 */
export const build: B = async (input) => {
  const timer = Time.timer();
  const { silent = true, pkg } = input;
  const { cwd, cmd, args, paths } = Wrangle.command(input, 'build');

  const output = await Process.invoke({ cwd, args, silent });
  const ok = output.success;

  const dir = paths.outDir;
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
      const dirs = { in: paths.input, out: paths.outDir };
      return Log.Build.toString({ ok, stdio, dirs, pad, pkg, bytes, hash, elapsed });
    },
  };
  return res;
};

/**
 * Helpers
 */
const wrangle = {
  async entryPath(dist: t.StringDir) {
    const paths = await Fs.glob(dist).find('pkg/-entry.*');
    const filename = paths[0]?.name ?? '';
    return filename ? `./pkg/${filename}` : '';
  },
} as const;
