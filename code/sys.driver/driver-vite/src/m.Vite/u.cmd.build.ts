import { Cmd, Fs, Pkg, Time, type t } from './common.ts';
import { Log, Wrangle } from './u.ts';

type B = t.ViteLib['build'];

/**
 * Run the <vite:build> command.
 */
export const build: B = async (input) => {
  const { silent = true, pkg } = input;
  const { env, cmd, args, paths } = Wrangle.command(input, 'build');
  const timer = Time.timer();

  const output = await Cmd.invoke({ args, env, silent });
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
    const path = Fs.join(dist, 'index.html');

    if (!(await Fs.exists(path))) {
      const placeholder = `Placeholder`;
      await Fs.ensureDir(Fs.dirname(path));
      await Deno.writeTextFile(path, placeholder);
    }

    const html = await Deno.readTextFile(path);
    const lines = html.split('\n');
    const script = lines.find((line) => line.includes('src="./pkg/-entry.'));
    return wrangle.src(script);
  },

  src(text: string = '') {
    const match = text.match(/src="([^"]*)"/);
    return match ? match[1] : '';
  },
} as const;
