import type { t } from './common.ts';

/** Request keyboard disposal, retry once, and retain ownership until listener work terminates. */
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

  await handle.finished;
  if (disposalFailure !== undefined) throw disposalFailure;
}
