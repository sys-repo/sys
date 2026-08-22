import { Keyboard } from './common.ts';
import type {
  GuiDistSource,
  GuiDistSourceStarted,
  InterruptHandle,
  SourceRuntimeServer,
  SourceStartDependencies,
} from './t.ts';
import { HOSTNAME, MANIFEST_ROUTE, ORIGIN, PORT } from './u.source.ts';

const DEFAULT_START_DEPS: SourceStartDependencies = Object.freeze({
  serve: (options, handler) => Deno.serve(options, handler),
  bindInterrupt(onInterrupt) {
    Deno.addSignalListener('SIGINT', onInterrupt);
    let active = true;
    return Object.freeze({
      dispose() {
        if (!active) return;
        Deno.removeSignalListener('SIGINT', onInterrupt);
        active = false;
      },
    });
  },
  bindKeyboard: Keyboard.bind,
  shutdownKeyboard: Keyboard.shutdown,
  print(input) {
    console.info(
      `\nDriver Pi GUI Dist source\n  root      ${input.dir}\n  manifest  ${input.manifest}\n  quit      ${input.quit}\n`,
    );
  },
});

type RuntimeState = {
  readonly failures: unknown[];
  listenerSettled: boolean;
  stopRequested: boolean;
  trustedKeyboardQuit: boolean;
};

/** Start one GUI Dist source at the fixed local acquisition authority. */
export function startGuiDistSource(source: GuiDistSource): Promise<GuiDistSourceStarted> {
  return startGuiDistSourceWith(source, DEFAULT_START_DEPS);
}

/** Internal runtime seam for proving fixed source authority and foreground settlement. */
export async function startGuiDistSourceWith(
  source: GuiDistSource,
  deps: SourceStartDependencies,
): Promise<GuiDistSourceStarted> {
  const state: RuntimeState = {
    failures: [],
    listenerSettled: false,
    stopRequested: false,
    trustedKeyboardQuit: false,
  };
  const lifecycle = new AbortController();
  const stop = () => {
    if (state.stopRequested) return;
    state.stopRequested = true;
    lifecycle.abort();
  };
  const fail = (cause: unknown) => {
    if (!state.failures.some((existing) => existing === cause)) state.failures.push(cause);
  };

  let listened: Deno.NetAddr | undefined;
  const server = deps.serve(
    {
      hostname: HOSTNAME,
      port: PORT,
      signal: lifecycle.signal,
      onListen(address) {
        listened = address;
      },
    },
    (request) => source.fetch(request),
  );
  const addr = listened ?? server.addr;
  void server.finished.then(
    () => {
      state.listenerSettled = true;
      if (!state.stopRequested) fail(new Error('GUI Dist source listener ended unexpectedly.'));
    },
    (cause) => {
      state.listenerSettled = true;
      fail(cause);
      stop();
    },
  );

  let interrupt: InterruptHandle | undefined;
  let keyboard: ReturnType<typeof Keyboard.bind>;
  try {
    interrupt = deps.bindInterrupt(stop);
    keyboard = deps.bindKeyboard({
      until: server.finished,
      onQuit() {
        state.trustedKeyboardQuit = true;
        stop();
      },
    });
    if (keyboard) {
      void keyboard.finished.then(
        () => {
          if (!(state.stopRequested || state.listenerSettled || state.trustedKeyboardQuit)) {
            fail(new Error('GUI Dist source keyboard control ended unexpectedly.'));
            stop();
          }
        },
        (cause) => {
          fail(cause);
          stop();
        },
      );
    }
    deps.print({
      dir: source.dir,
      manifest: `${ORIGIN}${MANIFEST_ROUTE}`,
      quit: keyboard ? 'Ctrl+C or Q' : 'Ctrl+C',
    });
  } catch (cause) {
    stop();
    let rollback: unknown;
    let rollbackFailed = false;
    try {
      await settleRuntime(server, keyboard, interrupt, deps, state);
    } catch (failure) {
      rollbackFailed = true;
      rollback = failure;
    }
    if (rollbackFailed) {
      const failures = rollback instanceof AggregateError ? rollback.errors : [rollback];
      throw new AggregateError(
        [cause, ...failures],
        'GUI Dist source startup and rollback failed.',
      );
    }
    throw cause;
  }

  const finished = settleRuntime(server, keyboard, interrupt, deps, state);
  void finished.catch(() => undefined);
  return Object.freeze({
    addr,
    hostname: HOSTNAME,
    port: PORT,
    origin: ORIGIN,
    finished,
    close() {
      stop();
      return finished;
    },
  });
}

async function settleRuntime(
  server: SourceRuntimeServer,
  keyboard: ReturnType<typeof Keyboard.bind>,
  interrupt: InterruptHandle | undefined,
  deps: SourceStartDependencies,
  state: RuntimeState,
): Promise<void> {
  try {
    await server.finished;
  } catch (cause) {
    if (!state.failures.some((existing) => existing === cause)) state.failures.push(cause);
  }

  try {
    interrupt?.dispose();
  } catch (cause) {
    if (!state.failures.some((existing) => existing === cause)) state.failures.push(cause);
  }

  if (keyboard) {
    try {
      await deps.shutdownKeyboard(keyboard);
    } catch (cause) {
      if (!state.failures.some((existing) => existing === cause)) state.failures.push(cause);
    }
  }

  if (state.failures.length === 1) throw state.failures[0];
  if (state.failures.length > 1) {
    throw new AggregateError(state.failures, 'GUI Dist source lifecycle failed.');
  }
}
