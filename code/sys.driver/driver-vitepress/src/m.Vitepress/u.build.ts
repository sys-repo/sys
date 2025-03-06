import { type t, c, Cli, Fs, VitepressLog, PATHS, Pkg, Process, Time } from './common.ts';

type B = t.VitepressLib['build'];
type R = t.VitepressBuildResponse;

/**
 * https://vitepress.dev/reference/cli#vitepress-build
 */
export const build: B = async (input = {}) => {
  const timer = Time.timer();
  const options = wrangle.options(input);
  const { pkg, srcDir = 'docs', silent = false } = options;

  const dirs = wrangle.dirs(options);
  const inDir = dirs.in;
  const outDir = dirs.out;

  if (!silent) {
    const table = Cli.table([]);
    const push = (label: string, ...value: string[]) => table.push([c.gray(label), ...value]);
    push('Directory:', c.gray(`${Fs.cwd()}/`));
    push('       in:', Fs.trimCwd(dirs.in));
    push('      out:', Fs.trimCwd(dirs.out));

    console.info(c.bold(c.brightGreen('Paths')));
    console.info(table.toString().trim());
    console.info();
  }

  let params = `--outDir=${outDir}`;
  if (srcDir) params += ` --srcDir=${srcDir}`;

  const cmd = `deno run -A --node-modules-dir npm:vitepress build ${inDir} ${params}`;
  const args = cmd.split(' ').slice(1);

  const spinner = Cli.spinner(c.gray('building...'), { start: false });
  if (!silent) spinner.start();

  const output = await Process.invoke({ args, silent: true });
  const ok = output.success;
  spinner?.clear().stop();

  /**
   * Write {pkg} into /dist so it's included within the digest-hash.
   */
  if (pkg) {
    const path = Fs.join(dirs.out, 'assets', '-pkg.json');
    await Fs.writeJson(path, pkg);
  }

  /**
   * Calculate the digest-hash and store it in the [dist.json] file.
   */
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
      return VitepressLog.Build.toString({ ok, pad, bytes, dirs, hash, pkg, elapsed });
    },
  };

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
