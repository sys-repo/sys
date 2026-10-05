import type { t } from './common.ts';

/** Iterator for a stream whose terminal outcome is already known. */
export function createClosedAsyncIterator<T>(terminal: t.StreamTerminal): AsyncIterator<T> {
  return {
    next: () => (terminal.ok ? done<T>() : Promise.reject(terminal.error)),
    return: () => done<T>(),
    throw: (error?: unknown) => Promise.reject(error),
  };
}

/** Adapt live events and a terminal notification to async iteration. */
export function createAsyncIterator<T>(args: {
  readonly id: t.Cmd.ReqId;
  readonly onEvent: (fn: (event: T) => void) => t.Lifecycle;
  readonly dispose: () => void;
  readonly terminal: () => t.StreamTerminal | undefined;
  readonly addTerminalHandler: (
    id: t.Cmd.ReqId,
    handler: t.StreamTerminalHandler,
  ) => () => void;
}): AsyncIterator<T> {
  const queue: T[] = [];
  let closed: t.StreamTerminal | undefined;
  let pendingNext: {
    readonly resolve: (result: IteratorResult<T>) => void;
    readonly reject: (error: unknown) => void;
  } | undefined;

  const subscription = args.onEvent((event) => {
    if (closed) return;

    if (pendingNext) {
      const next = pendingNext;
      pendingNext = undefined;
      next.resolve({ done: false, value: event });
    } else {
      queue.push(event);
    }
  });

  const removeTerminalHandler = args.addTerminalHandler(args.id, finish);
  const terminal = args.terminal();
  if (terminal) finish(terminal);

  return {
    next() {
      if (queue.length > 0) {
        const value = queue.shift() as T;
        return Promise.resolve({ done: false, value });
      }

      if (closed) return closed.ok ? done<T>() : Promise.reject(closed.error);

      return new Promise<IteratorResult<T>>((resolve, reject) => {
        pendingNext = { resolve, reject };
      });
    },

    return() {
      if (!closed) finish({ ok: true });
      args.dispose();
      return done<T>();
    },

    throw(error?: unknown) {
      if (!closed) finish({ ok: false, error });
      args.dispose();
      return Promise.reject(error);
    },
  };

  function finish(terminal: t.StreamTerminal) {
    if (closed) return;

    closed = terminal;
    subscription.dispose();
    removeTerminalHandler();

    if (!pendingNext) return;

    const next = pendingNext;
    pendingNext = undefined;
    if (terminal.ok) next.resolve({ done: true, value: undefined });
    else next.reject(terminal.error);
  }
}

/**
 * Helpers:
 */
function done<T>() {
  return Promise.resolve<IteratorResult<T>>({ done: true, value: undefined });
}
