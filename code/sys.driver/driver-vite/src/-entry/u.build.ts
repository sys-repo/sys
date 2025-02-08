import { type t, Cli, Path, PATHS, pkg, Vite } from './common.ts';

/**
 * Run a local HTTP server from entry command-args.
 */
export async function build(args: t.ViteEntryArgsBuild) {
  if (args.cmd !== 'build') return;
  const { silent } = args;

  if (!silent) console.info();
  const spinner = Cli.Spinner.create('building', { silent });

  const input = Path.resolve(args.in ?? '.');
  const outDir = Path.resolve(args.out ?? PATHS.dist);

  const bundle = await Vite.build({ pkg, input, outDir, silent });

  if (!silent) {
    spinner.stop();
    console.info(bundle.toString({ pad: true }));
  }
}
