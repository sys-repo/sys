import type { t } from '../common.ts';
import { DenoFile } from '@sys/driver-deno/runtime';
import { Path } from '@sys/fs/path';
import { Pkg } from '@sys/std/pkg';
import { dev as viteDev } from '../../m.vite/u.dev/mod.ts';
import { resolvePkgSubpath } from './u.pkgSubpath.ts';

type DevDependencies = {
  loadPkg: (cwd: t.StringAbsoluteDir) => Promise<t.Pkg>;
  start: (input: t.Vite.Dev.Args) => Promise<Pick<t.Vite.Dev.Process, 'listen'>>;
};

const DEFAULT_DEPS: DevDependencies = Object.freeze({
  start: viteDev,
  async loadPkg(cwd) {
    return Pkg.toPkg((await DenoFile.load(cwd)).data);
  },
});

/** Start the Vite dev server from entry command args. */
export async function dev(args: t.ViteEntry.Args.Dev) {
  return await devWith(args, DEFAULT_DEPS);
}

/** Internal dependency seam for deterministic entry orchestration tests. */
export async function devWith(
  args: t.ViteEntry.Args.Dev,
  deps: DevDependencies,
  options?: t.ViteEntry.DevOptions,
) {
  if (args.cmd !== 'dev') return;

  const pkgSubpath = resolvePkgSubpath(args);
  const cwd = Path.resolve(args.dir || '.');
  const owner = options?.jsrPackageDir;
  const link = owner !== undefined && Path.Is.absolute(owner) && Path.resolve(owner) === cwd;
  const pkg = await deps.loadPkg(cwd);
  const server = await deps.start({
    pkg,
    ...(pkgSubpath === undefined ? {} : { pkgSubpath }),
    ...(link ? { versionLink: 'jsr' } : {}),
    cwd,
    port: args.port,
    reporter: args.reporter,
    logLines: args.logLines ?? args['log-lines'],
  });
  return server.listen();
}

/** Present and run the selected development command. */
export async function dispatch(args: t.ViteEntry.Args.Dev, options?: t.ViteEntry.DevOptions) {
  await dispatchWith(args, (args) => devWith(args, DEFAULT_DEPS, options));
}

/** Internal command-runner seam for presentation tests. */
export async function dispatchWith(
  args: t.ViteEntry.Args.Dev,
  run: (args: t.ViteEntry.Args.Dev) => Promise<void>,
): Promise<void> {
  const { Tasks } = await import('../../m.fmt/u.Tasks.ts');
  Tasks.log({ cmd: 'dev' });
  await run(args);
}
