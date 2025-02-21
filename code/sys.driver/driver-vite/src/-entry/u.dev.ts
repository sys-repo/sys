import { type t, Path, pkg, Vite } from './common.ts';

/**
 * Run a local HTTP server from entry command-args.
 */
export async function dev(args: t.ViteEntryArgsDev) {
  if (args.cmd !== 'dev') return;

  const cwd = args.dir ? Path.resolve(args.dir) : Path.cwd();
  const server = await Vite.dev({ pkg, cwd });
  await server.listen();
}
