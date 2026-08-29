import { Fetch, Fs, FsPkg, HttpPull, Num, type t, Url } from './common.ts';
import {
  admitManifestResponse,
  causeReason as classifyCauseReason,
  failed,
  failedManifestChecksum,
  type ManifestFetchFailure,
  pullReason,
  verificationReason,
} from './u.failure.ts';
import { type InputSnapshot, prepareManifestCredentials, snapshotInput } from './u.input.ts';
import { admitManifest } from './u.manifest.ts';
import { sealTarget, snapshotAppliedSeal } from './u.seal.ts';

type Stage = t.FsRooted.Stage;
type Rooted = t.Fs.Rooted.Instance;
type Lease = t.FsRooted.Lease;
type Verification = t.FsPkg.Dist.Pinned.Verify.Result;

type FetchedManifest = {
  readonly bytes: Uint8Array;
  readonly requestedUrl: t.StringUrl;
  readonly finalUrl: t.StringUrl;
};

type FetchResult =
  | { readonly ok: true; readonly value: FetchedManifest }
  | ManifestFetchFailure;

type InitialGenerationSettlement =
  | { readonly kind: 'missing' }
  | { readonly kind: 'settled'; readonly result: t.Dist.MaterializeResult };

type LeaseAcquisition =
  | { readonly ok: true; readonly lease: Lease }
  | { readonly ok: false; readonly reason: t.Dist.FailureReason };

export type MaterializeDependencies = {
  readonly rooted: t.FsRooted.Lib;
};

const DEFAULT_DEPENDENCIES: MaterializeDependencies = Object.freeze({
  rooted: Fs.Capability.Rooted,
});

/** Settle one pinned Dist with an `existing`, `promoted`, or `failed` result. */
export const materialize: t.Dist.Materialize = (input) =>
  materializeWith(input, DEFAULT_DEPENDENCIES);

/** Settle one pinned Dist using package-internal host dependencies. */
export async function materializeWith(
  input: t.Dist.MaterializeArgs,
  dependencies: MaterializeDependencies,
): Promise<t.Dist.MaterializeResult> {
  const prepared = snapshotInput(input);
  if (!prepared.ok) return failed('input', prepared.reason);
  const args = prepared.value;
  const causeReason = (cause: unknown) =>
    classifyCauseReason(cause, dependencies.rooted.Is.failure);

  let rooted: Rooted;
  let generation: t.FsRooted.Target<'directory'>;
  let dir: t.StringAbsoluteDir;
  try {
    rooted = await dependencies.rooted.create({ root: args.storeDir, until: args.until });
    const admitted = await rooted.admit(
      [{ kind: 'directory', path: args.integrity }],
      { until: args.until },
    );
    generation = admitted.targets[0];
    dir = Fs.join(rooted.path, generation.path) as t.StringAbsoluteDir;
  } catch (cause) {
    return failed('storage', causeReason(cause));
  }

  const initial = await settleInitialGeneration(
    args,
    rooted,
    generation,
    dir,
    dependencies,
  );
  if (initial.kind === 'settled') return initial.result;

  let fetched: FetchResult;
  try {
    fetched = await fetchManifest(args);
  } catch (cause) {
    return failed('manifest-fetch', causeReason(cause));
  }
  if (!fetched.ok) {
    return fetched.reason === 'integrity-mismatch'
      ? failedManifestChecksum(fetched.manifestChecksum)
      : failed('manifest-fetch', fetched.reason);
  }

  const manifest = admitManifest(fetched.value.bytes, fetched.value.finalUrl, args.policy);
  if (!manifest.ok) return failed('manifest-admission', manifest.reason);

  let stage: Stage;
  try {
    stage = await rooted.createStage({ until: args.until });
  } catch (cause) {
    return failed('staging', causeReason(cause));
  }

  try {
    const targets = await stage.files.admit(
      [
        { kind: 'file', path: 'dist.json' },
        ...manifest.value.resources.map((resource) => ({
          kind: 'file' as const,
          path: resource.target,
        })),
      ],
      { until: args.until },
    );
    if (exceedsEntryLimit(targets.targets, args.policy.verification.entries)) {
      const cleanup = await discardStage(rooted, stage);
      return failed('staging', 'limit-exceeded', cleanup);
    }
    await stage.files.publishFile(targets.targets[0], fetched.value.bytes, {
      until: args.until,
    });
  } catch (cause) {
    const cleanup = await discardStage(rooted, stage);
    return failed('staging', causeReason(cause), cleanup);
  }

  let pull: t.HttpPull.Result;
  try {
    const operation = HttpPull.start({
      resources: manifest.value.resources,
      rooted: stage.files,
      policy: args.policy.resources,
      ...(args.credentials?.resources ? { credentials: args.credentials.resources } : {}),
      ...(args.until === undefined ? {} : { until: args.until }),
    });
    pull = await operation.done;
  } catch (cause) {
    const cleanup = await discardStage(rooted, stage);
    return failed('resource-pull', causeReason(cause), cleanup);
  }
  if (!pull.ok) {
    const cleanup = await discardStage(rooted, stage);
    return failed('resource-pull', pullReason(pull), cleanup);
  }

  let staged: Verification;
  try {
    staged = await FsPkg.Dist.Pinned.verify({
      dir: stage.path,
      integrity: args.integrity,
      limits: args.policy.verification,
      until: args.until,
    });
  } catch (cause) {
    const cleanup = await discardStage(rooted, stage);
    return failed('stage-verification', causeReason(cause), cleanup);
  }
  if (staged.kind !== 'verified') {
    const cleanup = await discardStage(rooted, stage);
    return failed('stage-verification', verificationReason(staged), cleanup);
  }

  return await promoteVerifiedStage(
    args,
    rooted,
    generation,
    dir,
    stage,
    fetched.value,
    pull.totals,
    dependencies,
  );
}

async function settleInitialGeneration(
  args: InputSnapshot,
  rooted: Rooted,
  generation: t.FsRooted.Target<'directory'>,
  dir: t.StringAbsoluteDir,
  dependencies: MaterializeDependencies,
): Promise<InitialGenerationSettlement> {
  const acquisition = await acquireGenerationLease(args, rooted, generation, dependencies);
  if (!acquisition.ok) {
    return Object.freeze({
      kind: 'settled',
      result: failed('storage', acquisition.reason),
    });
  }

  let settlement: InitialGenerationSettlement;
  try {
    let existing: Verification;
    try {
      existing = await FsPkg.Dist.Pinned.verify({
        dir,
        integrity: args.integrity,
        limits: args.policy.verification,
        until: args.until,
      });
    } catch (cause) {
      const occupied = await targetPresent(dir);
      settlement = Object.freeze({
        kind: 'settled',
        result: failed(
          'existing-verification',
          classifyCauseReason(cause, dependencies.rooted.Is.failure),
          'not-needed',
          occupied ? 'occupied' : undefined,
        ),
      });
      const releaseReason = await releaseGenerationLease(acquisition.lease, dependencies);
      return releaseReason
        ? Object.freeze({
          kind: 'settled',
          result: failed(
            'storage',
            releaseReason,
            'not-needed',
            occupied ? 'occupied' : undefined,
          ),
        })
        : settlement;
    }

    const occupied = await targetPresent(dir);
    if (existing.kind === 'verified') {
      settlement = Object.freeze({
        kind: 'settled',
        result: await settleExisting(
          args,
          rooted,
          generation,
          dir,
          acquisition.lease,
          dependencies,
        ),
      });
    } else if (occupied) {
      settlement = Object.freeze({
        kind: 'settled',
        result: failed(
          'existing-verification',
          verificationReason(existing),
          'not-needed',
          'occupied',
        ),
      });
    } else if (existing.kind !== 'missing') {
      settlement = Object.freeze({
        kind: 'settled',
        result: failed('existing-verification', verificationReason(existing)),
      });
    } else {
      settlement = Object.freeze({ kind: 'missing' });
    }
  } catch (cause) {
    settlement = Object.freeze({
      kind: 'settled',
      result: failed('storage', classifyCauseReason(cause, dependencies.rooted.Is.failure)),
    });
  }

  const releaseReason = await releaseGenerationLease(acquisition.lease, dependencies);
  if (!releaseReason) return settlement;
  const prior = settlement.kind === 'settled' ? settlement.result : undefined;
  return Object.freeze({
    kind: 'settled',
    result: failed(
      'storage',
      releaseReason,
      settlementCleanup(prior),
      settlementPublication(prior),
    ),
  });
}

async function promoteVerifiedStage(
  args: InputSnapshot,
  rooted: Rooted,
  generation: t.FsRooted.Target<'directory'>,
  dir: t.StringAbsoluteDir,
  stage: Stage,
  fetched: FetchedManifest,
  totals: t.HttpPull.ResourceTotals,
  dependencies: MaterializeDependencies,
): Promise<t.Dist.MaterializeResult> {
  const acquisition = await acquireGenerationLease(args, rooted, generation, dependencies);
  if (!acquisition.ok) {
    const cleanup = await discardStage(rooted, stage);
    return failed('promotion', acquisition.reason, cleanup);
  }

  let settlement: t.Dist.MaterializeResult;
  try {
    let promoted: t.FsRooted.PromotionResult;
    try {
      promoted = await rooted.promoteStage(stage, generation, {
        seal: true,
        lease: acquisition.lease,
        ...(args.until === undefined ? {} : { until: args.until }),
      });
    } catch (cause) {
      const cleanup = await discardStage(rooted, stage);
      if (dependencies.rooted.Is.failure(cause) && cause.committed) {
        let visible = false;
        try {
          visible = await targetPresent(dir);
        } catch {
          // The original typed promotion failure remains the strongest settled evidence.
        }
        if (visible) {
          // `committed` may describe private-stage mode changes; visibility alone cannot prove that
          // this stage published the target. Settle the generation conservatively as occupied.
          settlement = await settleVisible(
            args,
            rooted,
            generation,
            dir,
            acquisition.lease,
            fetched,
            totals,
            cleanup,
            'occupied',
            dependencies,
          );
        } else {
          settlement = failed(
            'promotion',
            classifyCauseReason(cause, dependencies.rooted.Is.failure),
            cleanup,
          );
        }
      } else {
        settlement = failed(
          'promotion',
          classifyCauseReason(cause, dependencies.rooted.Is.failure),
          cleanup,
        );
      }

      const releaseReason = await releaseGenerationLease(acquisition.lease, dependencies);
      return releaseReason
        ? failed(
          'promotion',
          releaseReason,
          settlementCleanup(settlement),
          settlementPublication(settlement),
        )
        : settlement;
    }

    const cleanup = promoted.cleanupError ? await discardStage(rooted, stage) : 'complete';
    settlement = await settleVisible(
      args,
      rooted,
      generation,
      dir,
      acquisition.lease,
      fetched,
      totals,
      cleanup,
      promoted.kind === 'published' ? 'committed' : 'occupied',
      dependencies,
      promoted.kind === 'published' ? promoted.seal : undefined,
    );
  } catch (cause) {
    const cleanup = await discardStage(rooted, stage);
    settlement = failed(
      'promotion',
      classifyCauseReason(cause, dependencies.rooted.Is.failure),
      cleanup,
    );
  }

  const releaseReason = await releaseGenerationLease(acquisition.lease, dependencies);
  return releaseReason
    ? failed(
      'promotion',
      releaseReason,
      settlementCleanup(settlement),
      settlementPublication(settlement),
    )
    : settlement;
}

async function acquireGenerationLease(
  args: InputSnapshot,
  rooted: Rooted,
  generation: t.FsRooted.Target<'directory'>,
  dependencies: MaterializeDependencies,
): Promise<LeaseAcquisition> {
  try {
    const acquired = await rooted.acquireLease([generation], {
      mode: 'exclusive',
      wait: true,
      ...(args.until === undefined ? {} : { until: args.until }),
    });
    return acquired.kind === 'acquired'
      ? Object.freeze({ ok: true, lease: acquired.lease })
      : Object.freeze({ ok: false, reason: 'filesystem-failure' });
  } catch (cause) {
    return Object.freeze({
      ok: false,
      reason: classifyCauseReason(cause, dependencies.rooted.Is.failure),
    });
  }
}

async function releaseGenerationLease(
  lease: Lease,
  dependencies: MaterializeDependencies,
): Promise<t.Dist.FailureReason | undefined> {
  try {
    await lease.release();
    return undefined;
  } catch (cause) {
    return classifyCauseReason(cause, dependencies.rooted.Is.failure);
  }
}

async function targetPresent(dir: t.StringAbsoluteDir): Promise<boolean> {
  return (await Fs.lstat(dir)) !== undefined;
}

function settlementCleanup(result: t.Dist.MaterializeResult | undefined): t.Dist.Cleanup {
  return result?.cleanup ?? 'not-needed';
}

function settlementPublication(
  result: t.Dist.MaterializeResult | undefined,
): t.Dist.FailedPublication | undefined {
  if (result?.kind === 'promoted') return 'committed';
  if (result?.kind === 'existing') return 'occupied';
  return result?.publication;
}

async function fetchManifest(args: InputSnapshot): Promise<FetchResult> {
  const requestedOrigin = new URL(args.manifestUrl).origin;
  if (!args.policy.manifest.sourceOrigins.includes(requestedOrigin)) {
    return { ok: false, reason: 'source-denied' };
  }

  const credentials = prepareManifestCredentials(args.credentials?.manifest);
  if (!credentials.ok) return { ok: false, reason: 'invalid-input' };

  const client = Fetch.make({
    policy: args.policy.manifest,
    ...(credentials.value ?? {}),
    ...(args.until === undefined ? {} : { until: args.until }),
  });

  try {
    const lower = await client.blob(args.manifestUrl, {}, { checksum: args.integrity });
    const response = admitManifestResponse(lower, args.integrity);
    if (!response.ok) return response;

    const size = response.data.size;
    if (!Num.Is.safeInt(size) || size > args.policy.verification.manifestBytes) {
      return { ok: false, reason: 'limit-exceeded' };
    }

    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await response.data.arrayBuffer());
    } catch {
      return { ok: false, reason: 'resource-failure' };
    }
    if (bytes.byteLength !== size) return { ok: false, reason: 'resource-failure' };

    return {
      ok: true,
      value: Object.freeze({
        bytes,
        requestedUrl: response.requestedUrl,
        finalUrl: response.finalUrl,
      }),
    };
  } finally {
    client.dispose();
  }
}

async function settleExisting(
  args: InputSnapshot,
  rooted: Rooted,
  generation: t.FsRooted.Target<'directory'>,
  dir: t.StringAbsoluteDir,
  lease: Lease,
  dependencies: MaterializeDependencies,
): Promise<t.Dist.MaterializeResult> {
  const sealed = await sealTarget(
    rooted,
    generation,
    lease,
    dependencies.rooted.Is.failure,
    args.until,
  );
  if (!sealed.ok) {
    return failed('sealing', sealed.reason, 'not-needed', 'occupied');
  }

  const final = await finalEvidence(
    args,
    dir,
    'not-needed',
    'occupied',
    dependencies,
    args.until,
  );
  return final.ok
    ? existingResult(args, dir, final.evidence, sealed.seal, 'not-needed')
    : final.failure;
}

async function settleVisible(
  args: InputSnapshot,
  rooted: Rooted,
  generation: t.FsRooted.Target<'directory'>,
  dir: t.StringAbsoluteDir,
  lease: Lease,
  fetched: FetchedManifest,
  totals: t.HttpPull.ResourceTotals,
  cleanup: t.Dist.Cleanup,
  publication: t.Dist.FailedPublication,
  dependencies: MaterializeDependencies,
  lowerSeal?: t.FsRooted.SealApplied,
): Promise<t.Dist.MaterializeResult> {
  let seal = snapshotAppliedSeal(lowerSeal);
  if (!seal) {
    // Never change permission metadata on a generation that is already observably invalid.
    const beforeSeal = await finalEvidence(args, dir, cleanup, publication, dependencies);
    if (!beforeSeal.ok) return beforeSeal.failure;

    const sealed = await sealTarget(
      rooted,
      generation,
      lease,
      dependencies.rooted.Is.failure,
    );
    if (!sealed.ok) return failed('sealing', sealed.reason, cleanup, publication);
    seal = sealed.seal;
  }

  const final = await finalEvidence(args, dir, cleanup, publication, dependencies);
  if (!final.ok) return final.failure;
  return publication === 'committed'
    ? promotedResult(args, dir, final.evidence, seal, fetched, totals, cleanup)
    : existingResult(args, dir, final.evidence, seal, cleanup);
}

type FinalEvidenceResult =
  | { readonly ok: true; readonly evidence: t.FsPkg.Dist.Pinned.Verify.Evidence }
  | { readonly ok: false; readonly failure: t.Dist.Failed };

async function finalEvidence(
  args: InputSnapshot,
  dir: t.StringAbsoluteDir,
  cleanup: t.Dist.Cleanup,
  publication: t.Dist.FailedPublication,
  dependencies: MaterializeDependencies,
  until?: t.UntilInput,
): Promise<FinalEvidenceResult> {
  let result: Verification;
  try {
    result = await FsPkg.Dist.Pinned.verify({
      dir,
      integrity: args.integrity,
      limits: args.policy.verification,
      ...(until === undefined ? {} : { until }),
    });
  } catch (cause) {
    return Object.freeze({
      ok: false,
      failure: failed(
        'final-verification',
        classifyCauseReason(cause, dependencies.rooted.Is.failure),
        cleanup,
        publication,
      ),
    });
  }
  return result.kind === 'verified'
    ? Object.freeze({ ok: true, evidence: result.evidence })
    : Object.freeze({
      ok: false,
      failure: failed(
        'final-verification',
        verificationReason(result),
        cleanup,
        publication,
      ),
    });
}

async function discardStage(rooted: Rooted, stage: Stage): Promise<t.Dist.Cleanup> {
  try {
    await rooted.discardStage(stage);
    return 'complete';
  } catch {
    return 'pending';
  }
}

function existingResult(
  args: InputSnapshot,
  dir: t.StringAbsoluteDir,
  verification: t.FsPkg.Dist.Pinned.Verify.Evidence,
  seal: t.FsRooted.SealApplied,
  cleanup: t.Dist.Cleanup,
): t.Dist.Existing {
  return Object.freeze({
    kind: 'existing',
    dir,
    integrity: args.integrity,
    verification,
    seal,
    source: Object.freeze({ configuredUrl: args.configuredUrl }),
    cleanup,
  });
}

function promotedResult(
  args: InputSnapshot,
  dir: t.StringAbsoluteDir,
  verification: t.FsPkg.Dist.Pinned.Verify.Evidence,
  seal: t.FsRooted.SealApplied,
  fetched: FetchedManifest,
  totals: t.HttpPull.ResourceTotals,
  cleanup: t.Dist.Cleanup,
): t.Dist.Promoted {
  return Object.freeze({
    kind: 'promoted',
    dir,
    integrity: args.integrity,
    verification,
    seal,
    source: Object.freeze({
      configuredUrl: args.configuredUrl,
      requestedUrl: safeSource(fetched.requestedUrl),
      finalUrl: safeSource(fetched.finalUrl),
    }),
    totals,
    cleanup,
  });
}

function safeSource(input: t.StringUrl): t.StringUrl {
  const canonical = Url.toCanonical(input);
  return canonical.ok ? canonical.href : '';
}

function exceedsEntryLimit(
  targets: readonly t.FsRooted.Target<'file'>[],
  limit: t.NumberTotal,
): boolean {
  const entries = new Set<string>();
  for (const target of targets) {
    entries.add(target.path);
    let separator = target.path.indexOf('/');
    while (separator >= 0) {
      entries.add(target.path.slice(0, separator));
      separator = target.path.indexOf('/', separator + 1);
    }
    if (entries.size > limit) return true;
  }
  return false;
}
