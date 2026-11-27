import { Cli, Open, type t } from '../common.ts';

type KeyboardDeps = {
  bind?: typeof Cli.Keyboard.bind;
  open?: (url: t.StringUrl) => void;
  exit?: (code: number) => void;
};

/** One lazily acquired keyboard session per dev-server handle. */
export function keyboardFactory(args: {
  cwd: t.StringDir;
  url: string;
  signal: AbortSignal;
  ownInputRelease: (released: Promise<void>) => void;
  redraw?: () => void;
  dispose: () => Promise<void>;
}, deps: KeyboardDeps = {}) {
  const { dispose, redraw, signal } = args;
  const url = new URL(args.url).href as t.StringUrl;
  const bind = deps.bind ?? Cli.Keyboard.bind;
  const open = deps.open ?? ((url) => Open.invokeDetached(args.cwd, url, { silent: true }));
  const exit = deps.exit ?? ((code) => Deno.exit(code));

  async function run() {
    if (signal.aborted) return await dispose();

    const until = Promise.withResolvers<void>();
    const onAbort = () => until.resolve();
    signal.addEventListener('abort', onAbort, { once: true });

    let quitting = false;
    let failure: { cause: unknown } | undefined;
    const rememberFailure = (cause: unknown) => {
      failure ??= { cause };
    };
    // Request now; await the lifecycle's shared completion only after input release.
    const stopServer = () => void dispose().catch(() => undefined);
    const onQuit = () => {
      if (signal.aborted) return;
      quitting = true;
      stopServer();
    };

    try {
      const binding = bind({
        until: until.promise,
        quitKeys: 'interrupt-only',
        onQuit,
        onKey(event) {
          if (signal.aborted) return 'stop';
          if (event.key === 'q') {
            onQuit();
            return 'stop';
          }
          const isOpen = event.key === 'o';
          try {
            if (isOpen) open(url);
            else if (Cli.Keyboard.Is.redraw(event)) redraw?.();
          } catch (cause) {
            // Keep the app error rather than letting the binding translate it.
            rememberFailure(cause);
            if (!isOpen) stopServer();
            return 'stop';
          }
        },
      });

      if (binding) {
        // Listener failures belong to the session, not to public server disposal.
        const released = binding.finished.catch(rememberFailure).then(async () => {
          const cause = binding.releaseFailure;
          if (!cause) return;
          // Recovery can restore stdin, but cannot turn an observed failure into success.
          await Cli.Keyboard.shutdown(binding).catch(() => undefined);
          throw cause;
        });
        args.ownInputRelease(released);
        await released.catch(rememberFailure);
      } else {
        await until.promise;
      }

      if (signal.aborted) await dispose().catch(rememberFailure);
      if (failure) throw failure.cause;
      if (quitting) exit(0);
    } finally {
      signal.removeEventListener('abort', onAbort);
    }
  }

  let session: Promise<void> | undefined;
  // Publish the shared promise before acquisition, including for reentrant callers.
  return () => session ??= Promise.resolve().then(run);
}
