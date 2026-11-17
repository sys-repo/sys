import { createHttpOperation } from '../../../u/u.operation.ts';
import type { t } from '../common.ts';
import type { NominalFailure, Operation } from './t.ts';
import { policyFailure } from './u.failure.ts';

export const CANCELLED = Symbol('HttpFetch.cancelled');

/** Bind shared deadline/body mechanics to Fetch-owned failure identities. */
export function createOperation(
  externalSignal: AbortSignal,
  timeout: t.Msecs,
): Operation<typeof CANCELLED> {
  const operation = createHttpOperation<typeof CANCELLED | NominalFailure>(
    externalSignal,
    timeout,
    {
      cancelled: CANCELLED,
      timeout: policyFailure('response-timeout'),
    },
  );
  return {
    ...operation,
    get signal() {
      return operation.signal;
    },
    get terminal() {
      return operation.terminal;
    },
    fail(kind): never {
      operation.throwIfStopped();
      operation.stop(policyFailure(kind));
      throw operation.terminal;
    },
  };
}
