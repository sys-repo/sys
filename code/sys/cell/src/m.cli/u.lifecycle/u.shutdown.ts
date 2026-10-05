import { Is } from '../common.ts';
import { mergeFailures } from './u.failure.ts';

/** Authoritative terminal reason for one Cell start lifecycle. */
export type ShutdownReason =
  | `signal:${Deno.Signal}`
  | 'keyboard:interrupt'
  | { readonly kind: 'presentation'; readonly cause: unknown };

/** First-request-wins shutdown authority for one Cell start lifecycle. */
export type ShutdownSignal = {
  readonly signal: AbortSignal;
  /** Settles only when a shutdown request becomes terminal. */
  readonly done: Promise<ShutdownReason>;
  readonly reason?: ShutdownReason;
  /** Request Ctrl+C-equivalent shutdown and escalation; true when this request becomes terminal. */
  interrupt(): boolean;
  /** Request presentation shutdown; true when this failure becomes terminal. */
  failPresentation(cause: unknown): boolean;
  /** Claim service completion without aborting or settling `done`; true when it becomes terminal. */
  seal(): boolean;
  /** Release process-signal listeners, retrying only bindings whose release failed. */
  dispose(): void;
};

type ShutdownSignalDeps = {
  addSignalListener(signal: Deno.Signal, handler: () => void): void;
  removeSignalListener(signal: Deno.Signal, handler: () => void): void;
  exit(code: number): never;
};

const DEFAULT_DEPS: ShutdownSignalDeps = {
  addSignalListener: (signal, handler) => Deno.addSignalListener(signal, handler),
  removeSignalListener: (signal, handler) => Deno.removeSignalListener(signal, handler),
  exit: (code) => Deno.exit(code),
};

export function createShutdownSignal(
  overrides: Partial<ShutdownSignalDeps> = {},
): ShutdownSignal {
  const deps: ShutdownSignalDeps = { ...DEFAULT_DEPS, ...overrides };
  const ctrl = new AbortController();
  const added: Array<{ readonly signal: Deno.Signal; readonly handler: () => void }> = [];
  let interruptCount = 0;
  let resolveDone: (reason: ShutdownReason) => void = () => undefined;
  let reason: ShutdownReason | undefined;
  let settled = false;

  const done = new Promise<ShutdownReason>((resolve) => {
    resolveDone = resolve;
  });
  const request = (nextReason: ShutdownReason) => {
    if (settled) return false;
    settled = true;
    reason = nextReason;
    resolveDone(reason);
    ctrl.abort(reason);
    return true;
  };
  const interrupt = (nextReason: Extract<ShutdownReason, string>) => {
    interruptCount += 1;
    const accepted = request(nextReason);
    if (interruptCount > 1) deps.exit(130);
    return accepted;
  };

  const add = (signal: Deno.Signal) => {
    const handler = () => interrupt(`signal:${signal}`);

    try {
      deps.addSignalListener(signal, handler);
      added.push({ signal, handler });
    } catch {
      // Some runtimes/platforms do not support all signals. Keep shutdown best-effort.
    }
  };

  add('SIGINT');
  add('SIGTERM');

  return {
    signal: ctrl.signal,
    done,
    get reason() {
      return reason;
    },
    interrupt: () => interrupt('keyboard:interrupt'),
    failPresentation: (cause) => request(Object.freeze({ kind: 'presentation' as const, cause })),
    seal() {
      if (settled) return false;
      settled = true;
      return true;
    },
    dispose() {
      let failed = false;
      let failure: unknown;
      const retained: typeof added = [];
      for (const entry of added.splice(0)) {
        try {
          deps.removeSignalListener(entry.signal, entry.handler);
        } catch (cause) {
          retained.push(entry);
          if (!failed) {
            failed = true;
            failure = cause;
          } else {
            failure = mergeFailures(failure, cause, 'Cell shutdown cleanup failed.');
          }
        }
      }
      added.push(...retained);
      if (failed) throw failure;
    },
  };
}

export function isInterruptShutdownReason(reason: unknown): boolean {
  return reason === 'keyboard:interrupt' || (Is.str(reason) && reason.startsWith('signal:'));
}
