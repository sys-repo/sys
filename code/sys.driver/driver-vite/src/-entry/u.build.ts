import { type t, DenoFile, Fs, Path, Pkg, Vite } from './common.ts';

/**
 * Run a local HTTP server from entry command-args.
 */
export async function build(args: t.ViteEntryArgsBuild) {
  const { silent } = args;
  if (args.cmd !== 'build') return;
  if (!silent) console.info();

  const cwd = args.dir ? Path.resolve(args.dir) : Path.cwd();
  const pkg = Pkg.toPkg((await DenoFile.load(cwd)).data);
  const bundle = await Vite.build({ cwd, pkg, silent, spinner: true });

  if (!silent) {
    console.info(bundle.toString({ pad: true }));
  }
}

/**
 * Helpers:
 */
const wrangle = {
  async pkg(cwd: t.StringDir) {
    const unknown = Pkg.unknown();
    const res = await Fs.readJson<t.Pkg>(Path.join(cwd, 'deno.json'));
    if (!res.data) return unknown;

    const { name, version } = res.data;
    return { ...unknown, name, version };
  },
} as const;
