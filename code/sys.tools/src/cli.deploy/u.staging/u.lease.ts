import type { t } from '../common.ts';

type Settlement<T> =
  | { readonly kind: 'value'; readonly value: T }
  | { readonly kind: 'error'; readonly error: unknown };

type FailureSettlement = {
  /** Roll back failed-generation authority while exclusive ownership is still held. */
  onError: (error: unknown) => Promise<void>;
  /** Stable noun phrase used when rollback itself fails. */
  errorLabel: string;
};

/** Settle one staging body, its leased rollback, and release without losing causal failures. */
export async function settleStagingLease<T>(
  lease: Pick<t.FsRooted.Lease, 'release'>,
  run: () => Promise<T>,
  failure?: FailureSettlement,
): Promise<T> {
  let body: Settlement<T>;
  try {
    body = { kind: 'value', value: await run() };
  } catch (error) {
    body = { kind: 'error', error };
  }

  let rollback: Settlement<void> | undefined;
  if (body.kind === 'error' && failure) {
    try {
      rollback = { kind: 'value', value: await failure.onError(body.error) };
    } catch (error) {
      rollback = { kind: 'error', error };
    }
  }

  let release: Settlement<void>;
  try {
    release = { kind: 'value', value: await lease.release() };
  } catch (error) {
    release = { kind: 'error', error };
  }

  if (body.kind === 'error') {
    const failures: unknown[] = [body.error];
    if (rollback?.kind === 'error') failures.push(rollback.error);
    if (release.kind === 'error') failures.push(release.error);
    if (failures.length > 1) {
      const rollbackFailed = rollback?.kind === 'error';
      const releaseFailed = release.kind === 'error';
      const message = rollbackFailed && releaseFailed
        ? `Deploy staging failed, ${failure?.errorLabel} failed, and ownership release also failed.`
        : rollbackFailed
        ? `Deploy staging failed and ${failure?.errorLabel} also failed.`
        : 'Deploy staging failed and ownership release also failed.';
      throw new AggregateError(failures, message, { cause: body.error });
    }
    throw body.error;
  }

  if (release.kind === 'error') throw release.error;
  return body.value;
}
