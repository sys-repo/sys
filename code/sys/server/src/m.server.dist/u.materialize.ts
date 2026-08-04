import { Fetch, Fs, FsPkg, HttpPull, Num, type t, Url } from './common.ts';
import { causeReason, failed, fetchReason, pullReason, verificationReason } from './u.failure.ts';
import { type InputSnapshot, prepareManifestCredentials, snapshotInput } from './u.input.ts';
import { admitManifest } from './u.manifest.ts';

type Method = t.ServerDist.Method;
type Stage = t.FsRooted.Stage;
type Rooted = t.Fs.Rooted.Instance;
type Verification = t.FsPkg.Dist.Pinned.Verify.Result;

type FetchedManifest = Readonly<{
  bytes: Uint8Array;
  requestedUrl: t.StringUrl;
  finalUrl: t.StringUrl;
}>;

type FetchResult =
  | { readonly ok: true; readonly value: FetchedManifest }
  | { readonly ok: false; readonly reason: t.ServerDist.FailureReason };

/** Settle one pinned Dist with an `existing`, `promoted`, or `failed` result. */
export const materialize: Method = async (input) => {
  const prepared = snapshotInput(input);
  if (!prepared.ok) return failed('input', prepared.reason);
  const args = prepared.value;

  let rooted: Rooted;
  let generation: t.FsRooted.Target<'directory'>;
  let dir: t.StringAbsoluteDir;
  try {
    rooted = await Fs.Capability.Rooted.create({ root: args.storeDir, until: args.until });
    const admitted = await rooted.admit(
      [{ kind: 'directory', path: args.integrity }],
      { until: args.until },
    );
    generation = admitted.targets[0];
    dir = Fs.join(rooted.path, generation.path) as t.StringAbsoluteDir;
  } catch (cause) {
    return failed('storage', causeReason(cause));
  }

  let initiallyPresent = false;
  try {
    initiallyPresent = (await Fs.lstat(dir)) !== undefined;
  } catch (cause) {
    return failed('storage', causeReason(cause));
  }

  let existing: Verification;
  try {
    existing = await FsPkg.Dist.Pinned.verify({
      dir,
      integrity: args.integrity,
      limits: args.policy.verification,
      until: args.until,
    });
  } catch (cause) {
    return failed(
      'existing-verification',
      causeReason(cause),
      'not-needed',
      initiallyPresent ? 'occupied' : undefined,
    );
  }

  if (existing.kind === 'verified') {
    return existingResult(args, dir, existing.evidence, 'not-needed');
  }
  if (initiallyPresent) {
    return failed(
      'existing-verification',
      verificationReason(existing),
      'not-needed',
      'occupied',
    );
  }
  if (existing.kind !== 'missing') {
    return failed('existing-verification', verificationReason(existing));
  }

  let fetched: FetchResult;
  try {
    fetched = await fetchManifest(args);
  } catch (cause) {
    return failed('manifest-fetch', causeReason(cause));
  }
  if (!fetched.ok) return failed('manifest-fetch', fetched.reason);

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

  let promoted: t.FsRooted.PromotionResult;
  try {
    promoted = await rooted.promoteStage(stage, generation, { until: args.until });
  } catch (cause) {
    const cleanup = await discardStage(rooted, stage);
    if (Fs.Capability.Rooted.Is.failure(cause) && cause.committed) {
      return await settleVisible(
        args,
        dir,
        fetched.value,
        pull.totals,
        cleanup,
        'committed',
      );
    }
    return failed('promotion', causeReason(cause), cleanup);
  }

  const cleanup = promoted.cleanupError ? await discardStage(rooted, stage) : 'complete';
  return await settleVisible(
    args,
    dir,
    fetched.value,
    pull.totals,
    cleanup,
    promoted.kind === 'published' ? 'committed' : 'occupied',
  );
};

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
    const response = await client.blob(args.manifestUrl, {}, { checksum: args.integrity });
    if (!response.ok) return { ok: false, reason: fetchReason(response) };
    if (
      response.checksum?.valid !== true ||
      response.checksum.expected !== args.integrity ||
      response.checksum.actual !== args.integrity
    ) {
      return { ok: false, reason: 'integrity-mismatch' };
    }

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

async function settleVisible(
  args: InputSnapshot,
  dir: t.StringAbsoluteDir,
  fetched: FetchedManifest,
  totals: t.HttpPull.ResourceTotals,
  cleanup: t.ServerDist.Cleanup,
  publication: t.ServerDist.FailedPublication,
): Promise<t.ServerDist.MaterializeResult> {
  let result: Verification;
  try {
    result = await FsPkg.Dist.Pinned.verify({
      dir,
      integrity: args.integrity,
      limits: args.policy.verification,
    });
  } catch (cause) {
    return failed('final-verification', causeReason(cause), cleanup, publication);
  }
  if (result.kind !== 'verified') {
    return failed(
      'final-verification',
      verificationReason(result),
      cleanup,
      publication,
    );
  }

  return publication === 'committed'
    ? promotedResult(args, dir, result.evidence, fetched, totals, cleanup)
    : existingResult(args, dir, result.evidence, cleanup);
}

async function discardStage(rooted: Rooted, stage: Stage): Promise<t.ServerDist.Cleanup> {
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
  cleanup: t.ServerDist.Cleanup,
): t.ServerDist.Existing {
  return Object.freeze({
    kind: 'existing',
    dir,
    integrity: args.integrity,
    verification,
    source: Object.freeze({ configuredUrl: args.configuredUrl }),
    cleanup,
  });
}

function promotedResult(
  args: InputSnapshot,
  dir: t.StringAbsoluteDir,
  verification: t.FsPkg.Dist.Pinned.Verify.Evidence,
  fetched: FetchedManifest,
  totals: t.HttpPull.ResourceTotals,
  cleanup: t.ServerDist.Cleanup,
): t.ServerDist.Promoted {
  return Object.freeze({
    kind: 'promoted',
    dir,
    integrity: args.integrity,
    verification,
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
