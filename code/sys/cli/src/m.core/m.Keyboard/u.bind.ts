import { keypress } from '@cliffy/keypress';
import type { t } from '../common.ts';
import { Is } from '../m.Is/mod.ts';
import { isQuit } from './u.isQuit.ts';
import { isUnavailableError } from './u.isUnavailableError.ts';

export function bind(options: t.CliKeyboard.Bind.Options): t.CliKeyboard.Bind.Handle | undefined {
  if (!Is.terminal('stdin')) return undefined;

  const keys = keypress();
  let disposed = false;
  let settled = false;
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const finished = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const finish = (error?: unknown) => {
    if (settled) return;
    settled = true;
    error === undefined ? resolve() : reject(error);
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (!keys.disposed) keys.dispose();
    finish();
  };

  void options.until?.then(dispose, dispose);
  void (async () => {
    try {
      for await (const event of keys) {
        if (disposed) return;
        if (isQuit(event)) {
          await options.onQuit();
          if (options.exit ?? false) Deno.exit(0);
          return;
        }
        await options.onKey?.(event);
      }
    } catch (error) {
      if (!disposed && !isUnavailableError(error)) {
        if (options.onError) {
          try {
            options.onError(error);
          } catch (cause) {
            finish(cause);
            return;
          }
        } else {
          finish(error);
          return;
        }
      }
    } finally {
      dispose();
    }
  })();

  return { dispose, finished };
}
