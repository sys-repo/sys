import type { t } from './common.ts';

import { createOwnedError, ownedError } from './u.error.ts';

export type CleanupIssue = Readonly<{
  resource: 'screen' | 'keyboard' | 'application-listener' | 'release' | 'status-listener';
  state: 'failed' | 'unresolved';
}>;

export type CleanupEvidence = Readonly<{
  kind: 'cleanup-failed';
  issues: readonly CleanupIssue[];
}>;

export type PresentationEvidence = Readonly<{
  kind: 'browser-open-failed';
  url: t.StringUrl;
}>;

/** Return the final primary error with bounded cleanup and presentation evidence, if any. */
export function finalError(input: {
  primary?: unknown;
  cleanup?: CleanupEvidence;
  presentation?: PresentationEvidence;
}): Error | undefined {
  if (input.primary === undefined && input.cleanup === undefined) return;

  const hasPrimary = input.primary !== undefined;
  const primary = hasPrimary
    ? ownedError(input.primary, 'start:gui failed.')
    : cleanupError(input.cleanup!);
  const secondary: Readonly<{ key: string; value: unknown }>[] = [];
  if (hasPrimary && input.cleanup) secondary.push({ key: 'cleanup', value: input.cleanup });
  if (input.presentation) {
    secondary.push({ key: 'presentation', value: input.presentation });
  }
  if (secondary.length === 0) return primary;

  try {
    for (const entry of secondary) {
      Object.defineProperty(primary, entry.key, {
        configurable: true,
        enumerable: true,
        value: entry.value,
      });
    }
    return primary;
  } catch {
    const error = createOwnedError(primary.message);
    Object.defineProperty(error, 'primary', { enumerable: true, value: primary });
    for (const entry of secondary) {
      Object.defineProperty(error, entry.key, { enumerable: true, value: entry.value });
    }
    return error;
  }
}

export function cleanupEvidence(issues: readonly CleanupIssue[]): CleanupEvidence | undefined {
  return issues.length === 0 ? undefined : Object.freeze({
    kind: 'cleanup-failed',
    issues: Object.freeze([...issues]),
  });
}

function cleanupError(evidence: CleanupEvidence): Error {
  const error = createOwnedError('start:gui cleanup failed.');
  Object.defineProperty(error, 'cleanup', {
    configurable: false,
    enumerable: true,
    value: evidence,
  });
  return error;
}
