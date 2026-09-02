import { Is, StartGuiIntrinsic } from '../common.ts';

import { createOwnedError, ownedError } from '../u.error.ts';
import type {
  CleanupEvidence,
  MaterializationSettlementEvidence,
  PresentationEvidence,
} from './t.ts';

/** Return the final primary error with typed secondary evidence, if any. */
export function finalError(input: {
  primary?: unknown;
  cleanup?: CleanupEvidence;
  presentation?: PresentationEvidence;
  materialization?: MaterializationSettlementEvidence;
}): Error | undefined {
  if (
    input.primary === undefined && input.cleanup === undefined &&
    input.materialization === undefined
  ) return;
  const hasPrimary = input.primary !== undefined;
  const primary = hasPrimary
    ? ownedError(input.primary, 'start:gui failed.')
    : input.cleanup
    ? cleanupError(input.cleanup)
    : createOwnedError('start:gui retained secondary materialization evidence.');
  const secondary: Readonly<{ key: string; value: unknown }>[] = [];
  if (hasPrimary && input.cleanup) {
    StartGuiIntrinsic.arrayPush(secondary, { key: 'cleanup', value: input.cleanup });
  }
  if (input.presentation) {
    StartGuiIntrinsic.arrayPush(secondary, { key: 'presentation', value: input.presentation });
  }
  if (input.materialization) {
    StartGuiIntrinsic.arrayPush(secondary, {
      key: 'materialization',
      value: input.materialization,
    });
  }
  if (secondary.length === 0) return primary;

  try {
    for (let index = 0; index < secondary.length; index += 1) {
      const entry = secondary[index];
      StartGuiIntrinsic.defineProperty(primary, entry.key, {
        configurable: true,
        enumerable: true,
        value: entry.value,
      });
    }
    return primary;
  } catch {
    const error = createOwnedError(errorMessage(primary));
    StartGuiIntrinsic.defineProperty(error, 'primary', { enumerable: true, value: primary });
    for (let index = 0; index < secondary.length; index += 1) {
      const entry = secondary[index];
      StartGuiIntrinsic.defineProperty(error, entry.key, {
        enumerable: true,
        value: entry.value,
      });
    }
    return error;
  }
}

function errorMessage(error: Error): string {
  try {
    const descriptor = StartGuiIntrinsic.ownPropertyDescriptor(error, 'message');
    return descriptor && 'value' in descriptor && Is.string(descriptor.value)
      ? descriptor.value
      : 'start:gui failed.';
  } catch {
    return 'start:gui failed.';
  }
}

function cleanupError(evidence: CleanupEvidence): Error {
  const error = createOwnedError('start:gui cleanup failed.');
  StartGuiIntrinsic.defineProperty(error, 'cleanup', {
    configurable: false,
    enumerable: true,
    value: evidence,
  });
  return error;
}
