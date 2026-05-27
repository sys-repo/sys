import { Is } from '../common.ts';

export type ShutdownSignal = {
  readonly signal: AbortSignal;
  readonly done: Promise<void>;
  readonly reason?: string;
  dispose(): void;
};

export function createShutdownSignal(): ShutdownSignal {
  const ctrl = new AbortController();
  const added: Array<{ readonly signal: Deno.Signal; readonly handler: () => void }> = [];
  let signalCount = 0;
  let resolveDone: () => void = () => undefined;
  let reason: string | undefined;

  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  const add = (signal: Deno.Signal) => {
    const handler = () => {
      signalCount += 1;
      reason = `signal:${signal}`;
      if (!ctrl.signal.aborted) ctrl.abort(reason);
      resolveDone();
      if (signalCount > 1) Deno.exit(130);
    };

    try {
      Deno.addSignalListener(signal, handler);
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
    dispose() {
      for (const entry of added) Deno.removeSignalListener(entry.signal, entry.handler);
    },
  };
}

export function isSignalShutdownReason(reason: unknown): reason is string {
  return Is.str(reason) && reason.startsWith('signal:');
}
