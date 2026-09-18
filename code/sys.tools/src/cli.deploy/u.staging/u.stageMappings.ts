import { Dispose, Fs, Path, pkg, type t } from '../common.ts';
import { shouldExclude } from '../u.exclude.ts';
import { createBuildResetToken } from './u.buildReset.ts';
import { finalizeDistTree } from './u.finalizeDistTree.ts';
import { acquireStagingBuildLease, combineStagingLeases } from './u.buildLease.ts';
import { throwIfStagingCancelled } from './u.cancel.ts';
import { stagingConcurrencyDefault } from './u.concurrency.ts';
import { executeStaging } from './u.execute.ts';
import {
  assertDirectoryIdentity,
  captureDirectoryIdentity,
  ensureStagingDirectory,
} from './u.identity.ts';
import { settleStagingLease } from './u.lease.ts';
import { createStagingManifestLedger, retractStagingManifests } from './u.manifest.ts';
import { type PreparedStagingMapping, prepareStagingPlan } from './u.prepare.ts';
import { verifyStagedDist } from './u.verifyStagedDist.ts';

export type StageMappingsArgs = {
  cwd: t.StringDir;
  mappings: t.DeployTool.Staging.Mapping[];
  stagingRoot: t.StringRelativeDir;
  sourceRoot?: string;
  buildResetHtml?: boolean;
  onProgress?: (e: t.DeployTool.Staging.ProgressEvent) => void;
  until?: t.UntilInput;
};

export type StageMappingsResult = {
  readonly stagingRoot: t.StringAbsoluteDir;
  readonly verification: t.Pkg.Dist.Local.Verify.Evidence;
};

type StageMappingsSnapshot = {
  readonly cwd: t.StringDir;
  readonly mappings: readonly t.DeployTool.Staging.Mapping[];
  readonly stagingRoot: t.StringRelativeDir;
  readonly sourceRoot?: string;
  readonly buildResetHtml?: boolean;
  readonly onProgress?: (e: t.DeployTool.Staging.ProgressEvent) => void;
  readonly until?: t.UntilInput;
};

/** One cwd-scoped cooperative lane for every operation that executes mutable build tasks. */
const BUILD_MUTATION_AUTHORITY: t.StringRelativeDir = '@sys.tools.deploy-build';

/** Stage one schedule-independent exact root Dist without presentation side-effects. */
export async function stageMappings(args: StageMappingsArgs): Promise<StageMappingsResult> {
  const input = snapshotStageMappingsArgs(args);
  const life = Dispose.abortable(input.until);
  try {
    return await stageMappingsWithSignal(input, life.signal);
  } finally {
    life.dispose('deploy-staging-complete');
  }
}

async function stageMappingsWithSignal(
  args: StageMappingsSnapshot,
  signal: AbortSignal,
): Promise<StageMappingsResult> {
  throwIfStagingCancelled(signal);
  const prepared = await prepareStagingPlan({
    cwd: args.cwd,
    mappings: args.mappings,
    stagingRoot: args.stagingRoot,
    sourceRoot: args.sourceRoot,
    signal,
  });
  const rooted = await Fs.Capability.Rooted.create({
    root: prepared.cwd,
    create: false,
    until: signal,
  });
  if (rooted.path !== prepared.cwd) {
    throw new Error('Deploy working directory must be supplied by its canonical path.');
  }
  const cwdIdentity = await captureDirectoryIdentity({
    path: prepared.cwd,
    label: 'Deploy working directory',
    signal,
  });

  const targetInputs: t.FsRooted.TargetInput<'directory'>[] = [];
  const targetPaths = new Set<string>();
  addTarget(prepared.stagingRootRel);
  // Serialize one top-level branch so nested roots cannot split cooperative ownership.
  addTarget(stagingOwnershipBranch(prepared.stagingRootRel));
  if (prepared.mappings.some((mapping) => mapping.mode === 'build+copy')) {
    addTarget(BUILD_MUTATION_AUTHORITY);
  }
  for (const mapping of prepared.mappings) {
    const relativeHost = Path.relative(prepared.cwd, mapping.staging);
    if (Path.Is.absolute(relativeHost) || !Path.Is.within(prepared.cwd, mapping.staging)) {
      throw new Error(`Deploy staging mapping target escaped preflight: ${mapping.staging}`);
    }
    addTarget(Path.relativePosix(relativeHost));
  }

  const admission = await rooted.Target.admit(targetInputs, operationOptions(signal));
  const target = admission.targets[0]!;
  const buildLease = await acquireStagingBuildLease({ mappings: prepared.mappings, signal });
  let acquired: t.FsRooted.LeaseResult;
  try {
    acquired = await rooted.Lease.acquire(admission.targets, {
      mode: 'exclusive',
      wait: false,
      ...operationOptions(signal),
    });
    if (acquired.kind === 'busy') {
      const reason = acquired.target.path === BUILD_MUTATION_AUTHORITY
        ? 'build mutation authority is already owned by another operation'
        : 'root is already owned by another operation';
      throw new Error(`Deploy staging ${reason}.`);
    }
  } catch (error) {
    if (!buildLease) throw error;
    return await settleStagingLease<StageMappingsResult>(
      buildLease,
      () => Promise.reject(error),
    );
  }

  const manifestLedger = createStagingManifestLedger();
  return await settleStagingLease(
    combineStagingLeases(acquired.lease, buildLease),
    async () => {
      await assertPreparedSourceIdentities(prepared.mappings, signal);
      await rooted.Tree.remove(target, { lease: acquired.lease, ...operationOptions(signal) });
      const stagingIdentity = await ensureStagingDirectory({
        root: cwdIdentity,
        path: prepared.stagingRoot,
        label: 'Deploy staging root',
        signal,
      });

      const identity = await Fs.Capability.Rooted.create({
        root: prepared.stagingRoot,
        create: false,
        until: signal,
      });
      if (identity.path !== prepared.stagingRoot || identity.path !== stagingIdentity.path) {
        throw new Error('Deploy staging root canonical identity changed during recreation.');
      }
      await assertRootIdentity(identity, signal);

      const buildResetToken = args.buildResetHtml ? createBuildResetToken() : undefined;
      await executeStaging({
        mappings: prepared.mappings,
        stagingIdentity,
        manifestLedger,
        concurrency: stagingConcurrencyDefault({ total: prepared.mappings.length }),
        onProgress: args.onProgress,
        signal,
      });

      await assertRootIdentity(identity, signal);
      await rooted.Tree.inspectSeal(target, { lease: acquired.lease, ...operationOptions(signal) });
      await finalizeDistTree({
        dir: identity.path,
        rootIdentity: stagingIdentity,
        pkg,
        builder: pkg,
        buildResetToken,
        indexes: prepared.mappings,
        manifestLedger,
        filter: (path) => !shouldExclude(Path.basename(path)),
        signal,
      });
      await assertRootIdentity(identity, signal);
      await rooted.Tree.inspectSeal(target, { lease: acquired.lease, ...operationOptions(signal) });

      const verification = await verifyStagedDist(identity.path, signal);
      await assertRootIdentity(identity, signal);
      return Object.freeze({ stagingRoot: identity.path, verification });
    },
    {
      errorLabel: 'manifest retraction',
      onError: () => retractStagingManifests(manifestLedger),
    },
  );

  function addTarget(path: string): void {
    if (targetPaths.has(path)) return;
    targetPaths.add(path);
    targetInputs.push({ kind: 'directory', path });
  }
}

async function assertPreparedSourceIdentities(
  mappings: readonly PreparedStagingMapping[],
  signal: AbortSignal,
): Promise<void> {
  for (const mapping of mappings) {
    if (mapping.mode === 'index') continue;
    await assertDirectoryIdentity(
      mapping.sourceIdentity,
      'Deploy staging mapping source',
      signal,
    );
  }
}

async function assertRootIdentity(
  rooted: t.FsRooted.Instance,
  signal: AbortSignal,
): Promise<void> {
  throwIfStagingCancelled(signal);
  await rooted.Target.admit(
    [{ kind: 'file', path: 'dist.json' }],
    operationOptions(signal),
  );
}

function stagingOwnershipBranch(path: t.StringRelativeDir): t.StringRelativeDir {
  const branch = Path.relativePosix(path).split('/').find((segment) => segment.length > 0);
  if (!branch) throw new Error(`Deploy staging ownership branch is invalid: ${path}`);
  return branch;
}

function operationOptions(signal: AbortSignal): t.FsRooted.OperationOptions {
  return { until: signal };
}

function snapshotStageMappingsArgs(args: StageMappingsArgs): StageMappingsSnapshot {
  const mappings = args.mappings.map((mapping, index): t.DeployTool.Staging.Mapping => {
    const mode = mapping?.mode;
    if (mode !== 'copy' && mode !== 'build+copy' && mode !== 'index') {
      throw new Error(
        `Deploy staging mapping[${index}] is invalid: unsupported mode: ${String(mode)}.`,
      );
    }
    const dir = mapping.dir;
    return Object.freeze({
      mode,
      dir: Object.freeze({
        source: String(dir?.source ?? ''),
        staging: String(dir?.staging ?? '') as t.StringRelativeDir,
      }),
    });
  });

  return Object.freeze({
    cwd: args.cwd,
    mappings: Object.freeze(mappings),
    stagingRoot: args.stagingRoot,
    ...(args.sourceRoot === undefined ? {} : { sourceRoot: args.sourceRoot }),
    ...(args.buildResetHtml === undefined ? {} : { buildResetHtml: args.buildResetHtml }),
    ...(args.onProgress === undefined ? {} : { onProgress: args.onProgress }),
    ...(args.until === undefined ? {} : { until: args.until }),
  });
}
