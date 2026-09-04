import { Is, type t } from './common.ts';
import { createOwnedError } from './u.error.ts';
import type { MaterializationFailureEvidence } from './u.state.ts';

type MaterializationError = Error & {
  readonly materialization: MaterializationFailureEvidence;
};

const MATERIALIZATION_ERRORS = new WeakSet<object>();

/** Determine whether a failure carries package-owned materialization evidence. */
export function isMaterializationError(input: unknown): input is MaterializationError {
  return Is.object(input) && MATERIALIZATION_ERRORS.has(input);
}

/** Preserve one admitted materialization failure behind package-owned error authority. */
export function materializationError(result: t.Dist.Failed): MaterializationError {
  const error = createOwnedError(
    `start:gui materialization failed: ${result.stage}/${result.reason}`,
  ) as MaterializationError;
  Object.defineProperty(error, 'materialization', {
    configurable: false,
    enumerable: true,
    value: snapshotMaterializationFailure(result),
  });
  MATERIALIZATION_ERRORS.add(error);
  return error;
}

function snapshotMaterializationFailure(
  result: t.Dist.Failed,
): MaterializationFailureEvidence {
  if (result.stage === 'manifest-fetch' && result.reason === 'integrity-mismatch') {
    return Object.freeze({
      stage: 'manifest-fetch',
      reason: 'integrity-mismatch',
      cleanup: 'not-needed',
      manifestChecksum: Object.freeze({
        expected: result.manifestChecksum.expected,
        received: result.manifestChecksum.received,
      }),
    });
  }
  return Object.freeze({
    stage: result.stage,
    reason: result.reason,
    cleanup: result.cleanup,
    ...(result.publication === undefined ? {} : { publication: result.publication }),
  }) as MaterializationFailureEvidence;
}
