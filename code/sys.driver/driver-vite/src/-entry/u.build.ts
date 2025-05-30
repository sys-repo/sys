import { type t, DenoFile, Path, Pkg, Vite } from './common.ts';

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
