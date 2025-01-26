import { type t, c, Cli, Fs, Log, PATHS, Pkg, Process, Time } from './common.ts';

type B = t.VitepressLib['build'];
type R = t.VitepressBuildResponse;

/**
 * https://vitepress.dev/reference/cli#vitepress-build
 */
export const build: B = async (input = {}) => {
  const timer = Time.timer();
  const options = wrangle.options(input);
  const { pkg, srcDir = 'docs', silent = true } = options;

  const spinner = Cli.spinner(c.gray('building...'));
  if (!silent) spinner.start();

  const dirs = wrangle.dirs(options);
  const inDir = dirs.in;
  const outDir = dirs.out;

  let params = `--outDir=${outDir}`;
  if (srcDir) params += ` --srcDir=${srcDir}`;

  const cmd = `deno run -A --node-modules-dir npm:vitepress build ${inDir} ${params}`;
  const args = cmd.split(' ').slice(1);
  const output = await Process.invoke({ args, silent });
  const ok = output.success;

  // Write {pkg} into /dist so it's included within the digest-hash.
  if (pkg) {
    const path = Fs.join(dirs.out, 'assets', '-pkg.json');
    await Fs.ensureDir(Fs.dirname(path));
    await Deno.writeTextFile(path, JSON.stringify(pkg, null, '  '));
  }

  // Calculate the `/dist.json` file and digest-hash.
  const entry = './index.html';
  const dist = (await Pkg.Dist.compute({ dir: dirs.out, pkg, entry, save: true })).dist;
  const elapsed = timer.elapsed.msec;

  if (!ok) {
    console.error(output.text.stderr);
  }

  // Finish up.
  const res: R = {
    ok,
    elapsed,
    get dirs() {
      return dirs;
    },
    get dist() {
      return dist;
    },
    toString(options = {}) {
      const { pad } = options;
      const bytes = dist.size.bytes;
      const hash = dist.hash.digest;
      return Log.Build.toString({ ok, pad, bytes, dirs, hash, pkg, elapsed });
    },
  };

  spinner?.stop();
  return res;
};

/**
 * Helpers
 */
const wrangle = {
  options(input: Parameters<B>[0]) {
    if (typeof input === 'string') return { inDir: input };
    if (input === undefined) return {};
    return input;
  },

  dirs(options: t.VitepressBuildArgs): R['dirs'] {
    const { inDir = '', outDir = '' } = options;
    return {
      in: Fs.resolve(inDir),
      out: outDir ? Fs.resolve(outDir) : Fs.resolve(inDir, PATHS.dist),
    };
  },
} as const;
