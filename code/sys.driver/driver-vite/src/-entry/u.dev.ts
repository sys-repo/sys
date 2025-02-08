import { pkg, type t, Vite } from './common.ts';

/**
 * Run a local HTTP server from entry command-args.
 */
export async function dev(args: t.ViteEntryArgsDev) {
  if (args.cmd !== 'dev') return;
  const input = args.in ?? '';
  const server = await Vite.dev({ pkg, input });
  await server.listen();
}
