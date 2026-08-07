import { c, Cli, Fs, Http, Pkg, pkg, type t } from './common.ts';
import type * as ViteT from '../m.vite/t.internal.ts';
import { ServeScreen } from '../m.vite/u/u.serve.screen.ts';
import { ServeStatic } from '../m.vite/u/u.serve.static.ts';

type Server = ReturnType<typeof Http.Server.start>;
type StaticSnapshot = ViteT.ViteServe.Static.Snapshot;
type ScreenReporter = ViteT.ViteServe.Screen.Reporter;

/**
 * Serve a production bundle from entry command args.
 */
export async function serve(args: t.ViteEntry.Args.Serve) {
  if (args.cmd !== 'serve') return;
  const { port = 8080, dir = 'dist', silent = false } = args;
  const staticSnapshot = await wrangle.staticSnapshot(dir);
  const dist = staticSnapshot.kind === 'directory' ? staticSnapshot.dist : undefined;
  const hash = dist?.hash.digest ?? '';
  const packageInfo = wrangle.pkg(dist);
  const screenMode = !silent && Cli.Is.interactive();

  const app = Http.Server.create({ pkg: packageInfo, hash, static: ['/*', dir] });
  const server = Http.Server.start(app, {
    port,
    pkg: packageInfo,
    hash,
    silent: silent || screenMode,
    info: { static: wrangle.staticInfo(staticSnapshot) },
    keyboard: { print: !silent },
  });
  if (!screenMode) {
    await server.finished;
    return;
  }

  const reporter = await wrangle.createScreen({
    server,
    pkg: packageInfo,
    static: staticSnapshot,
  });

  let reporterFailed = false;
  const presentation = reporter.failure.catch((error) => {
    reporterFailed = true;
    throw error;
  });
  let failed = false;
  let failure: unknown;
  try {
    await Promise.race([server.finished, presentation]);
  } catch (error) {
    failed = true;
    failure = error;
  }

  if (failed) {
    try {
      reporter.dispose();
    } catch {
      // Preserve the server or presentation error.
    }
    if (reporterFailed) await wrangle.closePreserving(server, failure);
    throw failure;
  }

  reporter.dispose();
}

/**
 * Helpers
 */
const wrangle = {
  async staticSnapshot(dir: string): Promise<StaticSnapshot> {
    const path = dir as t.StringDir;
    const stat = await Fs.stat(path);
    if (!stat) return { kind: 'missing', dir: path };
    if (!stat.isDirectory) return { kind: 'not-directory', dir: path };

    const { dist } = await Pkg.Dist.load(path);
    return { kind: 'directory', dir: path, ...(dist ? { dist } : {}) };
  },

  staticInfo(snapshot: StaticSnapshot) {
    const dir = ServeStatic.displayDir(snapshot.dir);
    const warning = ServeStatic.warning(snapshot);
    return warning ? `${dir} ${c.yellow(c.bold(warning))}` : dir;
  },

  pkg(dist?: t.DistPkg) {
    return dist?.pkg || pkg;
  },

  async createScreen(args: {
    readonly server: Server;
    readonly pkg: t.Pkg;
    readonly static: StaticSnapshot;
  }): Promise<ScreenReporter> {
    try {
      return ServeScreen.create({
        pkg: args.pkg,
        origin: args.server.origin,
        static: args.static,
        until: args.server.dispose$,
      });
    } catch (error) {
      return await wrangle.closePreserving(args.server, error);
    }
  },

  async closePreserving(server: Server, cause: unknown): Promise<never> {
    try {
      await server.close(cause);
    } catch {
      // Preserve the presentation error.
    }
    throw cause;
  },
} as const;
