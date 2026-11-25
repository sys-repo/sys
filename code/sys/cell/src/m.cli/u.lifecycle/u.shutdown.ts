import { Is, Process, type t } from '../common.ts';
import { mergeFailures } from './u.failure.ts';

/** Authoritative terminal reason for one Cell start lifecycle. */
export type ShutdownReason =
  | `signal:${Deno.Signal}`
  | 'keyboard:interrupt'
  | 'keyboard:quit'
  | { readonly kind: 'presentation'; readonly cause: unknown };

/** First-request-wins shutdown authority for one Cell start lifecycle. */
export type ShutdownSignal = {
  readonly signal: AbortSignal;
  /** Settles only when a shutdown request becomes terminal. */
  readonly done: Promise<ShutdownReason>;
  /** Either terminal winner retires ready controls, including a non-aborting service outcome. */
  readonly claimed: Promise<void>;
  readonly settled: boolean;
  readonly reason?: ShutdownReason;
  /** Request Ctrl+C-equivalent shutdown and escalation; true when this request becomes terminal. */
  interrupt(): boolean;
  /** Request normal shutdown without counting as an interrupt. */
  quit(): boolean;
  /** Request presentation shutdown; true when this failure becomes terminal. */
  failPresentation(cause: unknown): boolean;
  /** Claim service completion without aborting or settling `done`; true when it becomes terminal. */
  seal(): boolean;
  /** Release process-signal listeners, retrying only bindings whose release failed. */
  dispose(): void;
};

type ShutdownSignalDeps = {
  on: t.Process.Signal.Lib['on'];
  exit(code: number): never;
};

const DEFAULT_DEPS: ShutdownSignalDeps = {
  on: Process.Signal.on,
  exit: (code) => Deno.exit(code),
};

export function createShutdownSignal(
  overrides: Partial<ShutdownSignalDeps> = {},
): ShutdownSignal {
  const deps: ShutdownSignalDeps = { ...DEFAULT_DEPS, ...overrides };
  const ctrl = new AbortController();
  const disposers: Array<() => void> = [];
  let interruptCount = 0;
  let resolveDone: (reason: ShutdownReason) => void = () => undefined;
  let reason: ShutdownReason | undefined;
  let settled = false;

  const done = new Promise<ShutdownReason>((resolve) => {
    resolveDone = resolve;
  });
  const claimed = Promise.withResolvers<void>();
  const seal = () => {
    if (settled) return false;
    settled = true;
    claimed.resolve();
    return true;
  };
  const request = (nextReason: ShutdownReason) => {
    if (!seal()) return false;
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

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    try {
      const binding = deps.on(signal, () => interrupt(`signal:${signal}`));
      if (binding.kind === 'attached') disposers.push(binding.dispose);
    } catch {
      // Keep signal attachment best-effort; keyboard shutdown remains available.
    }
  }

  return {
    signal: ctrl.signal,
    done,
    claimed: claimed.promise,
    get settled() {
      return settled;
    },
    get reason() {
      return reason;
    },
    interrupt: () => interrupt('keyboard:interrupt'),
    quit: () => request('keyboard:quit'),
    failPresentation: (cause) => request(Object.freeze({ kind: 'presentation' as const, cause })),
    seal,
    dispose() {
      let failed = false;
      let failure: unknown;
      const retained: typeof disposers = [];
      for (const dispose of disposers.splice(0)) {
        try {
          dispose();
        } catch (cause) {
          retained.push(dispose);
          if (!failed) {
            failed = true;
            failure = cause;
          } else {
            failure = mergeFailures(failure, cause, 'Cell shutdown cleanup failed.');
          }
        }
      }
      disposers.push(...retained);
      if (failed) throw failure;
    },
  };
}

export function isInterruptShutdownReason(reason: unknown): boolean {
  return reason === 'keyboard:interrupt' || (Is.str(reason) && reason.startsWith('signal:'));
}
