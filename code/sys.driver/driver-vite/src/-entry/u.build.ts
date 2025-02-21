import { type t, Cli, Path, pkg, Vite } from './common.ts';

/**
 * Run a local HTTP server from entry command-args.
 */
export async function build(args: t.ViteEntryArgsBuild) {
  const { silent } = args;
  if (args.cmd !== 'build') return;
  if (!silent) console.info();

  const spinner = Cli.Spinner.create('building', { silent });
  const cwd = args.dir ? Path.resolve(args.dir) : Path.cwd();
  const bundle = await Vite.build({ cwd, pkg, silent });

  if (!silent) {
    spinner.stop();
    console.info(bundle.toString({ pad: true }));
  }
}
