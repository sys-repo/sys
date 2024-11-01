import { Cmd, Fs, Pkg, Time, type t } from './common.ts';
import { Log, Wrangle } from './u.ts';

/**
 * Run the <vite:build> command.
 */
export const build: t.ViteLib['build'] = async (input) => {
  const { silent = true, pkg } = input;
  const { env, cmd, args, paths } = Wrangle.command(input, 'build');
  const timer = Time.timer();

  const output = await Cmd.invoke({ args, env, silent });
  const size = await Fs.Size.dir(paths.outDir);
  const bytes = size.total.bytes;
  const ok = output.success;

  const dir = paths.outDir;
  if (pkg) {
    await Deno.writeTextFile(Fs.join(dir, 'pkg', '-pkg.json'), JSON.stringify(pkg, null, '  '));
  }

  const entry = await wrangle.entryPath(dir);
  const dist = (await Pkg.Dist.compute({ dir, pkg, entry, save: true })).dist;
  const hash = dist.hash.digest;
  const elapsed = timer.elapsed.msec;

  const res: t.ViteBuildResponse = {
    ok,
    dist,
    paths,
    cmd: { input: cmd, output },
    toString(options = {}) {
      const { pad } = options;
      const stdio = output.toString();
      return Log.Build.toString({ ok, stdio, paths, pad, pkg, bytes, hash, elapsed });
    },
  };
  return res;
};

/**
 * Helpers
 */
const wrangle = {
  async entryPath(dist: t.StringDir) {
    const html = await Deno.readTextFile(Fs.join(dist, 'index.html'));
    const lines = html.split('\n');
    const script = lines.find((line) => line.includes('src="./pkg/-entry.'));
    return wrangle.src(script);
  },

  src(text: string = '') {
    const match = text.match(/src="([^"]*)"/);
    return match ? match[1] : '';
  },
} as const;
