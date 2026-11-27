import { Rx, type t } from '../common.ts';

/** Acquire the outer lifetime synchronously, before startup yields to the child. */
export function createDevLifecycle(args: {
  proc: t.Process.Handle;
  until?: t.UntilInput;
  disposeScreen: () => void;
  disposeChild: (reason?: unknown) => Promise<void>;
}) {
  const shutdown = new AbortController();
  const procUntil = args.proc.dispose$.pipe(Rx.map(({ payload }) => ({ reason: payload.reason })));
  let inputRelease: Promise<void> | undefined;
  const ownInputRelease = (released: Promise<void>) => {
    inputRelease = released;
  };
  const disposeServer = async (reason?: unknown) => {
    try {
      args.disposeScreen();
    } finally {
      await args.disposeChild(reason);
    }
  };
  const life = Rx.lifecycleAsync([args.until, procUntil], async ({ reason }) => {
    // A synchronous bind may reenter disposal before it returns its handle. Read the
    // release promise after that stack unwinds; never join the session that awaits us.
    const [server, input] = await Promise.allSettled([
      disposeServer(reason),
      Promise.resolve().then(() => inputRelease),
    ]);
    if (server.status === 'rejected') throw server.reason;
    if (input.status === 'rejected') throw input.reason;
  });
  // Publish the start boundary before cleanup or public disposal observers can reenter.
  life.dispose$.pipe(Rx.take(1)).subscribe(({ payload }) => shutdown.abort(payload.reason));
  return { life, signal: shutdown.signal, ownInputRelease };
}

/** Forward the owner's completion and live state; both keyboard entries join one session. */
export function devHandle(
  proc: t.Process.Handle,
  life: t.LifecycleAsync,
  port: number,
  url: string,
  keyboard: t.Vite.Dev.Process['keyboard'],
): t.Vite.Dev.Process {
  return {
    port,
    url,
    listen: keyboard,
    keyboard,
    get proc() {
      return proc;
    },
    dispose: life.dispose,
    [Symbol.asyncDispose]: life[Symbol.asyncDispose],
    get dispose$() {
      return life.dispose$;
    },
    get disposed() {
      return life.disposed;
    },
  };
}
