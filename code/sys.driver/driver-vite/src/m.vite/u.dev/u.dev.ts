import { Perf } from '../../common/u.perf.ts';
import { Path, Process, type t, Time } from '../common.ts';
import { keyboardFactory } from '../u/u.keyboard.ts';
import { Log } from '../u/u.log.ts';
import { Wrangle } from '../u/u.wrangle.ts';
import { createDevLifecycle, devHandle } from './u.lifecycle.ts';
import { createDevOutput } from './u.output.ts';
import { createReadiness } from './u.readiness.ts';
import { DevScreen } from './u.screen.ts';
import { packageIdentity, prepareStartup, startupError } from './u.startup.ts';

/** Run the Vite development server. */
export const dev: t.Vite.Lib['dev'] = (input) => devWithDeps(input);

/** Coordinate startup and transfer cleanup ownership as each resource is acquired. */
export async function devWithDeps(input: t.Vite.Dev.Args, deps: t.ViteDevDeps = {}) {
  const identity = packageIdentity(input);
  const { silent = false, pkg } = input;
  const reporter = DevScreen.resolveReporter(input.reporter, { silent, hasPkg: Boolean(pkg) });
  const parentOwnsOutput = reporter === 'screen';
  const startedAt = Time.now.timestamp as t.Msecs;
  const end = Perf.section(
    'dev.parent.total',
    { cwd: input.cwd ?? '', silent, reporter },
    { level: 1 },
  );
  const { paths, dist, requestedPort, strictPort, flags } = await prepareStartup(input, deps);
  const { cwd } = paths;
  const command = deps.command ?? Wrangle.command;
  const spawn = deps.spawn ?? Process.spawn;
  const createScreen = deps.createScreen ?? DevScreen.create;
  const createKeyboard = deps.keyboardFactory ?? keyboardFactory;

  const ready = createReadiness(requestedPort, strictPort, deps.waitForHttp);
  const logLines = DevScreen.logLines(input.logLines);
  const output = createDevOutput(logLines, parentOwnsOutput && Boolean(pkg));

  let rollback: ((reason?: unknown) => Promise<void>) | undefined;
  try {
    const bootstrap = await Perf.measure(
      'dev.parent.command',
      async () => {
        const acquired = await command(paths, flags);
        rollback = acquired.dispose;
        return acquired;
      },
      { cwd, port: requestedPort },
      { level: 2 },
    );
    if (!silent && !parentOwnsOutput && pkg) Log.Entry.log(pkg, Path.join(cwd, paths.app.entry));
    const proc = spawn({
      cwd,
      args: bootstrap.args,
      env: bootstrap.env,
      silent: silent || parentOwnsOutput,
      readySignal: ready.readySignal,
    });
    const disposeChild = async (reason?: unknown) => {
      try {
        await proc.dispose(reason);
      } finally {
        await bootstrap.dispose();
      }
    };
    rollback = disposeChild;
    let screen: t.ViteDev.Screen.Reporter | undefined;
    const { life, signal, ownInputRelease } = createDevLifecycle({
      proc,
      until: input.until,
      disposeScreen: () => screen?.dispose(),
      disposeChild,
    });
    rollback = life.dispose;

    if (parentOwnsOutput && identity) {
      screen = createScreen({
        identity,
        versionLink: input.versionLink,
        dist,
        paths,
        url: ready.url,
        output,
        logLines,
        until: life.dispose$,
      });
    }
    const pushOutput = (event: t.Process.Event) => {
      output.push(event);
      screen?.outputChanged();
    };
    proc.onStdOut(pushOutput);
    proc.onStdErr(pushOutput);

    const { port, resolvedUrl } = await ready.wait(proc, signal);
    Perf.log('dev.parent.ready', {
      requestedPort,
      port,
      requestedUrl: ready.requestedUrl,
      resolvedUrl,
      elapsed: Time.elapsed(startedAt).msec,
    }, { level: 1 });
    end({ port, resolvedUrl, elapsed: Time.elapsed(startedAt).msec });
    screen?.ready();

    const keyboard = createKeyboard({
      cwd,
      url: resolvedUrl,
      signal,
      ownInputRelease,
      ...(screen ? { redraw: () => screen.redraw() } : {}),
      dispose: life.dispose,
    });
    return devHandle(proc, life, port, resolvedUrl, keyboard);
  } catch (cause) {
    if (!rollback) throw cause; // No command acquired.
    try {
      await rollback(cause);
    } catch {
      // Preserve the startup failure, including when rollback itself fails.
    }
    throw startupError({ cwd, requestedPort, strictPort, output, cause });
  }
}
