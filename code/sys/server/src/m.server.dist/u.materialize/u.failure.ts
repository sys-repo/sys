import type { t } from './common.ts';

/** Build one frozen sanitized materialization failure. */
export function failed(
  stage: t.Dist.FailureStage,
  reason: t.Dist.FailureReason,
  cleanup: t.Dist.Cleanup = 'not-needed',
  publication?: t.Dist.FailedPublication,
): t.Dist.Failed {
  return Object.freeze({
    kind: 'failed',
    stage,
    reason,
    cleanup,
    ...(publication ? { publication } : {}),
  });
}

/** Classify a thrown host or Rooted failure without exposing its cause. */
export function causeReason(
  cause: unknown,
  isRootedFailure: t.FsRooted.IsLib['failure'],
): t.Dist.FailureReason {
  if (isRootedFailure(cause)) {
    if (cause.kind === 'cancelled') return 'cancelled';
    if (cause.kind === 'unsupported') return 'unsupported';
    return 'filesystem-failure';
  }
  return 'execution-failure';
}

/** Classify one bounded manifest Fetch failure. */
export function fetchReason(
  response: t.HttpFetch.ResponseFailure,
): t.Dist.FailureReason {
  if (response.status === 499) return 'cancelled';
  if (response.checksum?.valid === false) return 'integrity-mismatch';
  switch (response.error.policyFailure) {
    case 'invalid-policy':
      return 'invalid-policy';
    case 'invalid-request':
    case 'invalid-url':
      return 'invalid-input';
    case 'source-denied':
    case 'redirect-downgrade':
      return 'source-denied';
    case 'response-timeout':
      return 'timeout';
    case 'response-too-large':
      return 'limit-exceeded';
    default:
      return response.status === 408 ? 'timeout' : 'resource-failure';
  }
}

/** Classify one checksum-pinned Pull failure. */
export function pullReason(
  result: t.HttpPull.ResultFailure,
): t.Dist.FailureReason {
  const kind = result.terminal?.kind ?? result.ops.find((item) => !item.ok)?.kind;
  switch (kind) {
    case 'invalid-input':
    case 'invalid-resource':
      return 'invalid-input';
    case 'invalid-policy':
      return 'invalid-policy';
    case 'cancelled':
      return 'cancelled';
    case 'source-denied':
      return 'source-denied';
    case 'retry-limit':
    case 'total-timeout':
      return 'timeout';
    case 'resource-limit':
    case 'file-limit':
    case 'aggregate-limit':
      return 'limit-exceeded';
    case 'checksum-mismatch':
      return 'integrity-mismatch';
    case 'target-admission':
    case 'publication-failure':
      return 'filesystem-failure';
    default:
      return 'resource-failure';
  }
}

/** Classify one pinned verification failure. */
export function verificationReason(
  result: t.FsPkg.Dist.Pinned.Verify.Failure,
): t.Dist.FailureReason {
  switch (result.kind) {
    case 'invalid-input':
      return 'invalid-policy';
    case 'cancelled':
      return 'cancelled';
    case 'limit-exceeded':
      return 'limit-exceeded';
    case 'integrity-mismatch':
      return 'integrity-mismatch';
    case 'malformed':
      return 'malformed-manifest';
    default:
      return 'verification-failure';
  }
}
