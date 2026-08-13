import { DenoFile, Path, Pkg, type t, Vite } from './common.ts';
import { resolvePkgSubpath } from './u.pkgSubpath.ts';

type DevDependencies = {
  loadPkg: (cwd: t.StringAbsoluteDir) => Promise<t.Pkg>;
  start: (input: t.Vite.Dev.Args) => Promise<Pick<t.Vite.Dev.Process, 'listen'>>;
};

const DEFAULT_DEPS: DevDependencies = Object.freeze({
  async loadPkg(cwd) {
    return Pkg.toPkg((await DenoFile.load(cwd)).data);
  },
  start: Vite.dev,
});

/** Start the Vite dev server from entry command args. */
export async function dev(args: t.ViteEntry.Args.Dev) {
  return await devWith(args, DEFAULT_DEPS);
}

/** Internal dependency seam for deterministic entry orchestration tests. */
export async function devWith(args: t.ViteEntry.Args.Dev, deps: DevDependencies) {
  if (args.cmd !== 'dev') return;

  const pkgSubpath = resolvePkgSubpath(args);
  const cwd = args.dir ? Path.resolve(args.dir) : Path.cwd();
  const pkg = await deps.loadPkg(cwd);
  const server = await deps.start({
    pkg,
    ...(pkgSubpath === undefined ? {} : { pkgSubpath }),
    cwd,
    port: args.port,
    reporter: args.reporter,
    logLines: args.logLines ?? args['log-lines'],
  });
  return server.listen();
}
