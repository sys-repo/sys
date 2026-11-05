import type { t } from './common.ts';

const completionJoins = new WeakMap<t.Cli.Keyboard.Bind.Handle, () => Promise<void>>();

/** Keep native recovery joinable without replacing a handle's original lifecycle outcome. */
export function registerShutdownCompletion(
  handle: t.Cli.Keyboard.Bind.Handle,
  join: () => Promise<void>,
): void {
  completionJoins.set(handle, join);
}

/**
 * Request disposal and await callbacks and the current input-release attempt.
 */
export async function shutdown(handle: t.Cli.Keyboard.Bind.Handle): Promise<void> {
  let disposalFailure: unknown;
  try {
    handle.dispose();
  } catch {
    try {
      handle.dispose();
    } catch (cause) {
      disposalFailure = cause;
    }
  }

  const join = completionJoins.get(handle);
  await (join ? join() : handle.finished);
  if (disposalFailure !== undefined) throw disposalFailure;
}
