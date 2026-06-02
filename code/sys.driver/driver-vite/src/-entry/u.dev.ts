import { type t, DenoFile, Path, Pkg, Vite } from './common.ts';

/**
 * Start the Vite dev server from entry command args.
 */
export async function dev(args: t.ViteEntry.Args.Dev) {
  if (args.cmd !== 'dev') return;

  const cwd = args.dir ? Path.resolve(args.dir) : Path.cwd();
  const pkg = Pkg.toPkg((await DenoFile.load(cwd)).data);
  const server = await Vite.dev({ pkg, cwd });
  return server.listen();
}
