import { type t, Cli, pkg, Vite } from './common.ts';

/**
 * Run a local HTTP server from entry command-args.
 */
export async function build(args: t.ViteEntryArgsBuild) {
  if (args.cmd !== 'build') return;
  const { input = '', silent } = args;

  if (!silent) console.info();
  const spinner = Cli.Spinner.create('building', { silent });

  const outDir = args.output;
  const bundle = await Vite.build({ pkg, input, outDir, silent });

  if (!silent) {
    spinner.stop();
    console.info(bundle.toString({ pad: true }));
  }
}
