import { Err } from '../common.ts';

import type { Keyboard, Started } from './u.deps.ts';

export type Close = (reason: string) => Promise<void>;

export function closeOnce(started: () => Started | undefined): Close {
  let closePromise: Promise<void> | undefined;
  return (reason) => {
    const active = started();
    if (!active) return Promise.resolve();
    closePromise ??= Promise.resolve().then(() => active.close(reason));
    return closePromise;
  };
}

export async function waitForTerminal(input: {
  started: Started;
  keyboard: NonNullable<Keyboard>;
  close: Close;
}): Promise<void> {
  const terminal = await Promise.race([
    input.started.finished.then(() => 'server' as const),
    input.keyboard.finished.then(() => 'keyboard' as const),
  ]);
  if (terminal === 'keyboard') await input.close('start:gui.keyboard.finished');
}

export async function finalize(input: {
  keyboard: Keyboard | undefined;
  close: Close;
}): Promise<unknown | undefined> {
  const failures: unknown[] = [];
  try {
    input.keyboard?.dispose();
  } catch (cause) {
    failures.push(cause);
  }
  try {
    await input.close('start:gui.finalized');
  } catch (cause) {
    failures.push(cause);
  }

  if (failures.length === 0) return undefined;
  if (failures.length === 1) return failures[0];
  return new AggregateError(failures, 'start:gui cleanup failed.');
}

export function appendCleanup(primary: unknown, cleanup: unknown): Error {
  const error = Err.normalize(primary) as Error & { cleanup?: unknown };
  try {
    Object.defineProperty(error, 'cleanup', {
      configurable: true,
      enumerable: true,
      value: cleanup,
    });
    return error;
  } catch {
    return new AggregateError([primary, cleanup], error.message);
  }
}
