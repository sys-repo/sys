import { Cmd, Fs, Pkg, type t } from './common.ts';

type B = t.VitePressLib['build'];
type R = t.VitePressBuildResponse;

/**
 * https://vitepress.dev/reference/cli#vitepress-build
 */
export const build: B = async (input = {}) => {
  const options = wrangle.options(input);
  const { pkg, silent = false } = options;
  const dir = wrangle.dir(options);

  const cmd = `deno run -A --node-modules-dir npm:vitepress build ${dir.in} --outDir=${dir.out}`;
  const args = cmd.split(' ').slice(1);
  const output = await Cmd.invoke({ args, silent });
  const ok = output.success;

  // Write {pkg} into /dist so it's included within the digest-hash.
  if (pkg) {
    const path = Fs.join(dir.out, 'assets', '-pkg.json');
    await Fs.ensureDir(Fs.dirname(path));
    await Deno.writeTextFile(path, JSON.stringify(pkg, null, '  '));
  }

  // Calculate the `/dist.json` file and digest-hash.
  const entry = './index.html';
  const dist = (await Pkg.Dist.compute({ dir: dir.out, pkg, entry, save: true })).dist;

  // Finish up.
  const res: R = {
    ok,
    dir,
    get dist() {
      return dist;
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

  dir(options: t.VitePressBuildOptions): R['dir'] {
    const { inDir = '', outDir = '' } = options;
    return {
      in: Fs.resolve(inDir),
      out: outDir ? Fs.resolve(outDir) : Fs.resolve(inDir, '.vitepress/dist'),
    };
  },
} as const;
