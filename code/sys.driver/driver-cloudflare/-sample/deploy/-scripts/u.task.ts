import { R2 } from '@sys/driver-cloudflare/r2';
import { missingCredentialsOf } from '../src/m.deployment/mod.ts';
import { Is, type t } from './common.ts';
import { formatMissingCredentials, formatR2Failure } from './u.fmt.ts';

// Local identity retains approved detail without attaching causes or trusting error properties.
const r2Failures = new WeakMap<Error, t.R2.Error.Diagnostic>();

/** Capture an admitted R2 diagnostic for the task runner; never retain the provider error. */
export function r2Failure(detail: t.R2.Error.Diagnostic): Error {
  const captured = Object.freeze({ ...detail });
  const error = new Error(
    `${R2.Error.format(captured)} No automatic retry or cleanup was performed.`,
  );
  r2Failures.set(error, captured);
  return error;
}

/** Present recognized failures once; executable entrypoints own the returned process exit code. */
export async function runTask(
  task: t.CredentialTask,
  run: () => Promise<unknown>,
  log: (message: string) => void = console.error,
): Promise<0 | 1> {
  try {
    await run();
    return 0;
  } catch (error) {
    const names = missingCredentialsOf(error);
    const detail = Is.error(error) ? r2Failures.get(error) : undefined;
    const output = names
      ? formatMissingCredentials(task, names)
      : detail
      ? formatR2Failure(task, detail)
      : undefined;
    if (output === undefined) throw error;
    log(`${output}\n`);
    return 1;
  }
}
