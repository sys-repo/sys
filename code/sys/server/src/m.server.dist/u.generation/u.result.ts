import { Obj, type t } from './common.ts';
import {
  dataValue,
  isAppliedSeal,
  isCleanup,
  isFailureReason,
  isFailureStage,
  isFrozenData,
  isManifestChecksum,
  isSource,
  isTotals,
  isVerification,
} from './u.is.ts';
import type { InputSnapshot } from './u.input.ts';

const freeze = Object.freeze;

/** Admit one complete materialization settlement at the Generation owner boundary. */
export function admitMaterializeResult(
  input: unknown,
  expected: {
    args: InputSnapshot;
    dir: t.StringAbsoluteDir;
  },
): t.Dist.MaterializeResult | undefined {
  try {
    if (!isFrozenData(input, ['kind'], false)) return;
    const kind = dataValue(input, 'kind');
    if (kind === 'existing' || kind === 'promoted') return admitSuccess(input, kind, expected);
    if (kind === 'failed') return admitFailure(input, expected.args.manifest.integrity);
    return;
  } catch {
    return;
  }
}

/** Build one exact frozen Generation-owned failed-open settlement. */
export function failed(
  phase: 'input',
  reason: 'invalid-input' | 'cancelled' | 'execution-failure',
  ownership: 'not-acquired',
): t.Dist.Generation.Failure.Result;
export function failed(
  phase: 'store',
  reason: 'cancelled' | 'busy' | 'filesystem-failure' | 'execution-failure',
  ownership: 'not-acquired',
): t.Dist.Generation.Failure.Result;
export function failed(
  phase: 'store' | 'materialization',
  reason: 'cancelled' | 'execution-failure',
  ownership: 'released' | 'pending',
): t.Dist.Generation.Failure.Result;
export function failed(
  phase: t.Dist.Generation.Failure.Phase,
  reason: t.Dist.Generation.Failure.Reason,
  ownership: t.Dist.Generation.Failure.Ownership,
): t.Dist.Generation.Failure.Result {
  return freeze({ kind: 'failed', phase, reason, ownership }) as t.Dist.Generation.Failure.Result;
}

/** Preserve one exact admitted nested materialization failure. */
export function materializationFailed(
  generation: t.Dist.Failed,
  ownership: 'released' | 'pending',
): t.Dist.Generation.Failure.Materialization {
  return freeze({ kind: 'failed', phase: 'materialization', generation, ownership });
}

/** Publish one exact frozen successful outer settlement. */
export function opened(
  generation: t.Dist.Existing | t.Dist.Promoted,
  owner: t.Dist.Generation.Owner,
): t.Dist.Generation.Open.Success {
  return freeze({ kind: 'opened', generation, owner });
}

function admitSuccess(
  input: Record<PropertyKey, unknown>,
  kind: 'existing' | 'promoted',
  expected: {
    args: InputSnapshot;
    dir: t.StringAbsoluteDir;
  },
): t.Dist.Existing | t.Dist.Promoted | undefined {
  const keys = kind === 'existing'
    ? ['kind', 'dir', 'integrity', 'verification', 'seal', 'source', 'cleanup']
    : ['kind', 'dir', 'integrity', 'verification', 'seal', 'source', 'totals', 'cleanup'];
  if (!isFrozenData(input, keys)) return;
  const cleanup = dataValue(input, 'cleanup');
  const seal = dataValue(input, 'seal');
  const verification = dataValue(input, 'verification');
  if (
    dataValue(input, 'dir') !== expected.dir ||
    dataValue(input, 'integrity') !== expected.args.manifest.integrity ||
    !isCleanup(cleanup) ||
    !isAppliedSeal(seal) ||
    !isVerification(verification, expected.args)
  ) {
    return;
  }

  const source = dataValue(input, 'source');
  if (!isSource(source, kind, expected.args)) return;
  if (
    kind === 'promoted' &&
    !isTotals(
      dataValue(input, 'totals'),
      verification.assets.files,
      verification.assets.totalBytes,
      expected.args.manifest.policy.resources,
    )
  ) return;
  return input as t.Dist.Existing | t.Dist.Promoted;
}

function admitFailure(
  input: Record<PropertyKey, unknown>,
  expectedIntegrity: t.StringHash,
): t.Dist.Failed | undefined {
  const stage = dataValue(input, 'stage');
  const reason = dataValue(input, 'reason');
  const cleanup = dataValue(input, 'cleanup');
  if (!isFailureStage(stage) || !isFailureReason(reason) || !isCleanup(cleanup)) return;

  const hasPublication = Obj.hasOwn(input, 'publication');
  const hasManifestChecksum = Obj.hasOwn(input, 'manifestChecksum');
  const keys = [
    'kind',
    'stage',
    'reason',
    'cleanup',
    ...(hasPublication ? ['publication'] : []),
    ...(hasManifestChecksum ? ['manifestChecksum'] : []),
  ];
  if (!isFrozenData(input, keys)) return;
  if (
    hasPublication &&
    dataValue(input, 'publication') !== 'committed' &&
    dataValue(input, 'publication') !== 'occupied'
  ) {
    return;
  }

  if (hasManifestChecksum) {
    if (
      stage !== 'manifest-fetch' || reason !== 'integrity-mismatch' ||
      cleanup !== 'not-needed' || hasPublication ||
      !isManifestChecksum(dataValue(input, 'manifestChecksum'), expectedIntegrity)
    ) {
      return;
    }
  } else if (stage === 'manifest-fetch' && reason === 'integrity-mismatch') {
    return;
  }

  return input as t.Dist.Failed;
}
