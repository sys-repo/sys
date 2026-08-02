import { DenoFile, Path, Pkg, type t, Vite } from './common.ts';

/**
 * Start the Vite dev server from entry command args.
 */
export async function dev(args: t.ViteEntry.Args.Dev) {
  if (args.cmd !== 'dev') return;

  const cwd = args.dir ? Path.resolve(args.dir) : Path.cwd();
  const pkg = withSubpath(Pkg.toPkg((await DenoFile.load(cwd)).data), args);
  const server = await Vite.dev({
    pkg,
    cwd,
    port: args.port,
    reporter: args.reporter,
    logLines: args.logLines ?? args['log-lines'],
  });
  return server.listen();
}

function withSubpath(pkg: t.Pkg, args: t.ViteEntry.Args.Dev): t.Pkg {
  const subpath = (args.pkgSubpath ?? args['pkg-subpath'])?.trim().replace(/^\/+|\/+$/g, '');
  return subpath ? { ...pkg, name: `${pkg.name}/${subpath}` } : pkg;
}
