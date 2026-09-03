import { Fs, Hash, Json, Path, Pkg, Str, type t } from '../common.ts';
import { ensureIndexHtml } from './u.generateHtml.ts';
import { throwIfStagingCancelled } from './u.cancel.ts';
import { assertDirectoryIdentity, captureDirectoryIdentity } from './u.identity.ts';
import {
  createStagingManifestLedger,
  removeStagingManifest,
  retainStagingManifest,
  stagingManifestIntegrity,
  type StagingManifestLedger,
  type StagingManifestRecord,
  validateStagingManifest,
} from './u.manifest.ts';
import type { PreparedStagingMapping } from './u.prepare.ts';

type FinalizationHooks = {
  afterManifest?: (dir: t.StringAbsoluteDir) => void;
  onHashProgress?: (
    event: Parameters<NonNullable<t.Pkg.Dist.Compute.Args['onHashProgress']>>[0],
  ) => void;
};

type Args = {
  dir: t.StringAbsoluteDir;
  rootIdentity: t.DeployTool.Staging.DirectoryIdentity;
  filter?: (path: t.StringPath) => boolean;
  pkg?: t.Pkg;
  builder?: t.Pkg;
  buildResetToken?: string;
  indexes?: readonly PreparedStagingMapping[];
  manifestLedger?: StagingManifestLedger;
  signal?: AbortSignal;
  hooks?: FinalizationHooks;
};

type FinalizedDistTree = {
  readonly rootManifest: StagingManifestRecord;
};

type Settlement<T = void> =
  | { readonly kind: 'value'; readonly value: T }
  | { readonly kind: 'error'; readonly error: unknown };

/**
 * Settle one exact root Dist through retained, bottom-up directory identities.
 * Every non-root manifest written here is temporary and removed before return.
 */
export async function finalizeDistTree(args: Args): Promise<FinalizedDistTree> {
  throwIfStagingCancelled(args.signal);
  const root: t.StringAbsoluteDir = Path.resolve(args.dir, '.');
  if (args.rootIdentity.path !== root) {
    throw new Error(`Deploy staging finalizer received the wrong root identity: ${root}`);
  }
  await assertDirectoryIdentity(args.rootIdentity, 'Deploy staging root', args.signal);

  const directories = await collectDirectories(root, args.rootIdentity, args.signal);
  const identities = new Map(directories.map((identity) => [identity.path, identity]));
  const indexes = (args.indexes ?? []).filter((mapping) => mapping.mode === 'index');
  const explicitTargets = new Set(indexes.map((mapping) => Path.resolve(mapping.staging, '.')));
  const blocked = blockedAncestors(root, explicitTargets);
  const manifests = args.manifestLedger ?? createStagingManifestLedger();

  let body: Settlement<FinalizedDistTree>;
  try {
    await finalize({
      args,
      root,
      directories: [...directories],
      identities,
      indexes,
      blocked,
      manifests,
    });
    await assertDirectoryIdentity(args.rootIdentity, 'Deploy staging root', args.signal);
    const rootManifest = requireManifest(manifests, root);
    await validateManifest(rootManifest, args.rootIdentity);
    throwIfStagingCancelled(args.signal);
    body = { kind: 'value', value: Object.freeze({ rootManifest }) };
  } catch (error) {
    body = { kind: 'error', error };
  }

  let cleanup: Settlement;
  try {
    await removeTemporaryManifests(root, manifests, identities, body.kind === 'value');
    cleanup = { kind: 'value', value: undefined };
  } catch (error) {
    cleanup = { kind: 'error', error };
  }

  if (body.kind === 'error' && cleanup.kind === 'error') {
    throw new AggregateError(
      [body.error, cleanup.error],
      'Deploy staging finalization failed and temporary-manifest cleanup also failed.',
      { cause: body.error },
    );
  }
  if (body.kind === 'error') throw body.error;
  if (cleanup.kind === 'error') {
    try {
      await retractFinalizedDistTree(body.value, args.rootIdentity);
      if (manifests.get(root) === body.value.rootManifest) manifests.delete(root);
    } catch (retractionError) {
      throw new AggregateError(
        [cleanup.error, retractionError],
        'Deploy staging temporary-manifest cleanup failed and root-manifest retraction also failed.',
        { cause: cleanup.error },
      );
    }
    throw cleanup.error;
  }
  return body.value;
}

/** Remove only the unchanged root manifest produced by this exact finalization. */
export async function retractFinalizedDistTree(
  finalization: FinalizedDistTree,
  rootIdentity: t.DeployTool.Staging.DirectoryIdentity,
): Promise<void> {
  const record = finalization.rootManifest;
  if (record.dir !== rootIdentity.path || record.path !== Fs.join(rootIdentity.path, 'dist.json')) {
    throw new Error('Deploy staging finalization evidence does not match its retained root.');
  }
  await removeManifest(record, rootIdentity);
  await assertDirectoryIdentity(rootIdentity, 'Deploy staging root');
}

async function finalize(input: {
  args: Args;
  root: t.StringAbsoluteDir;
  directories: t.DeployTool.Staging.DirectoryIdentity[];
  identities: Map<t.StringAbsoluteDir, t.DeployTool.Staging.DirectoryIdentity>;
  indexes: Extract<PreparedStagingMapping, { mode: 'index' }>[];
  blocked: Set<string>;
  manifests: StagingManifestLedger;
}): Promise<void> {
  const finalized = new Set<string>();

  for (const identity of input.directories) {
    throwIfStagingCancelled(input.args.signal);
    if (input.blocked.has(identity.path)) continue;
    await settleDefaultDirectory(
      input.args,
      input.root,
      identity,
      input.identities,
      input.manifests,
    );
    finalized.add(identity.path);
  }

  const indexTargets = input.indexes.map((mapping) => Path.resolve(mapping.staging, '.'));
  for (const mapping of input.indexes) {
    throwIfStagingCancelled(input.args.signal);
    const target = Path.resolve(mapping.staging, '.');
    const targetIdentity = requireIdentity(input.identities, target, 'index target');
    const sourceIdentity = requireIdentity(input.identities, mapping.source, 'index source');
    await assertDirectoryIdentity(sourceIdentity, 'Deploy staging index source', input.args.signal);
    await assertDirectoryIdentity(targetIdentity, 'Deploy staging index target', input.args.signal);
    await ensureIndexHtml(mapping.source, {
      targetDir: target,
      force: true,
      buildResetToken: input.args.buildResetToken,
      includeDistLink: target === input.root,
      excludeDirs: indexTargets,
    });
    await assertDirectoryIdentity(sourceIdentity, 'Deploy staging index source', input.args.signal);
    await writeManifest(input.args, targetIdentity, input.identities, input.manifests);
    finalized.add(target);
  }

  for (const identity of input.directories) {
    throwIfStagingCancelled(input.args.signal);
    if (!input.blocked.has(identity.path) || finalized.has(identity.path)) continue;
    await settleDefaultDirectory(
      input.args,
      input.root,
      identity,
      input.identities,
      input.manifests,
    );
    finalized.add(identity.path);
  }

  if (!finalized.has(input.root)) {
    throw new Error('Deploy staging finalizer did not produce a root manifest.');
  }
  throwIfStagingCancelled(input.args.signal);
}

async function settleDefaultDirectory(
  args: Args,
  root: t.StringAbsoluteDir,
  identity: t.DeployTool.Staging.DirectoryIdentity,
  identities: Map<t.StringAbsoluteDir, t.DeployTool.Staging.DirectoryIdentity>,
  manifests: StagingManifestLedger,
): Promise<void> {
  throwIfStagingCancelled(args.signal);
  await assertDirectoryIdentity(identity, 'Deploy staging finalizer directory', args.signal);
  await ensureIndexHtml(identity.path, {
    force: true,
    buildResetToken: args.buildResetToken,
    includeDistLink: identity.path === root,
  });
  await assertDirectoryIdentity(identity, 'Deploy staging finalizer directory', args.signal);
  await writeManifest(args, identity, identities, manifests);
}

async function writeManifest(
  args: Args,
  identity: t.DeployTool.Staging.DirectoryIdentity,
  identities: Map<t.StringAbsoluteDir, t.DeployTool.Staging.DirectoryIdentity>,
  manifests: StagingManifestLedger,
): Promise<void> {
  throwIfStagingCancelled(args.signal);
  await assertDirectoryIdentity(identity, 'Deploy staging manifest directory', args.signal);
  await validateChildManifests(identity.path, manifests, identities);

  const manifestPath: t.StringAbsolutePath = Fs.join(identity.path, 'dist.json');
  const previous = manifests.get(identity.path);
  if (previous) await validateManifest(previous, identity);
  else if (await Fs.lstat(manifestPath)) throw unsafeManifest(manifestPath);

  const computed = await Pkg.Dist.compute({
    dir: identity.path,
    pkg: args.pkg,
    builder: args.builder,
    save: false,
    filter: args.filter,
    trustChildDist: true,
    onHashProgress(event) {
      throwIfStagingCancelled(args.signal);
      args.hooks?.onHashProgress?.(event);
      throwIfStagingCancelled(args.signal);
    },
  });
  if (computed.error) throw computed.error;

  const json = Json.stringify(computed.dist, 2);
  const integrity = String(computed.manifest?.integrity ?? '');
  if (!integrity || Hash.sha256(json) !== integrity) {
    throw new Error(`Deploy staging manifest integrity was not produced: ${identity.path}`);
  }

  throwIfStagingCancelled(args.signal);
  await assertDirectoryIdentity(identity, 'Deploy staging manifest directory', args.signal);
  await validateChildManifests(identity.path, manifests, identities);
  const written = await Fs.write(manifestPath, json, { force: true });
  if (written.error) {
    try {
      const observedIntegrity = await stagingManifestIntegrity(manifestPath);
      retainStagingManifest({
        ledger: manifests,
        directoryIdentity: identity,
        integrity: observedIntegrity,
      });
    } catch (retentionError) {
      throw new AggregateError(
        [written.error, retentionError],
        'Deploy staging manifest write failed and its resulting bytes could not be retained.',
        { cause: written.error },
      );
    }
    throw written.error;
  }

  const record = retainStagingManifest({
    ledger: manifests,
    directoryIdentity: identity,
    integrity,
  });
  await assertDirectoryIdentity(identity, 'Deploy staging manifest directory', args.signal);
  await validateManifest(record, identity);
  args.hooks?.afterManifest?.(identity.path);
  throwIfStagingCancelled(args.signal);
}

async function validateChildManifests(
  parent: t.StringAbsoluteDir,
  manifests: StagingManifestLedger,
  identities: Map<t.StringAbsoluteDir, t.DeployTool.Staging.DirectoryIdentity>,
): Promise<void> {
  for (const record of manifests.values()) {
    if (Path.dirname(record.dir) !== parent) continue;
    await validateManifest(record, requireIdentity(identities, record.dir, 'manifest directory'));
  }
}

async function validateManifest(
  record: StagingManifestRecord,
  identity: t.DeployTool.Staging.DirectoryIdentity,
): Promise<void> {
  if (!sameDirectoryIdentity(record.directoryIdentity, identity)) throw unsafeManifest(record.path);
  await validateStagingManifest(record);
}

async function removeManifest(
  record: StagingManifestRecord,
  identity: t.DeployTool.Staging.DirectoryIdentity,
): Promise<void> {
  if (!sameDirectoryIdentity(record.directoryIdentity, identity)) throw unsafeManifest(record.path);
  await removeStagingManifest(record);
}

async function removeTemporaryManifests(
  root: t.StringAbsoluteDir,
  manifests: StagingManifestLedger,
  identities: Map<t.StringAbsoluteDir, t.DeployTool.Staging.DirectoryIdentity>,
  keepRoot: boolean,
): Promise<void> {
  const records = [...manifests.values()]
    .filter((record) => !(keepRoot && record.dir === root))
    .toSorted((a, b) => compareDeepestFirst(a.dir, b.dir));
  const failures: unknown[] = [];

  for (const record of records) {
    try {
      await removeManifest(
        record,
        requireIdentity(identities, record.dir, 'manifest directory'),
      );
      if (manifests.get(record.dir) === record) manifests.delete(record.dir);
    } catch (error) {
      failures.push(error);
    }
  }

  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    throw new AggregateError(failures, 'Deploy staging temporary-manifest cleanup failed.');
  }
}

function blockedAncestors(root: string, targets: Set<string>): Set<string> {
  const blocked = new Set<string>();
  for (const target of targets) {
    let cursor = target;
    while (true) {
      blocked.add(cursor);
      if (cursor === root) break;
      const parent = Path.dirname(cursor);
      if (parent === cursor || !isWithin(root, parent)) {
        throw new Error(`Deploy index target escapes the staging root: ${target}`);
      }
      cursor = parent;
    }
  }
  return blocked;
}

async function collectDirectories(
  root: t.StringAbsoluteDir,
  rootIdentity: t.DeployTool.Staging.DirectoryIdentity,
  signal?: AbortSignal,
): Promise<readonly t.DeployTool.Staging.DirectoryIdentity[]> {
  throwIfStagingCancelled(signal);
  const entries = await Fs.glob(root, { includeDirs: true }).find('**/*');
  throwIfStagingCancelled(signal);
  const paths = [
    root,
    ...entries.filter((entry) => entry.isDirectory).map((entry) => Path.resolve(entry.path, '.')),
  ];
  const unique = [...new Set(paths)].toSorted(compareDeepestFirst);
  const identities: t.DeployTool.Staging.DirectoryIdentity[] = [];

  for (const path of unique) {
    if (!isWithin(root, path)) {
      throw new Error(`Deploy staging finalizer directory escapes its root: ${path}`);
    }
    await assertDirectoryIdentity(rootIdentity, 'Deploy staging root', signal);
    identities.push(
      await captureDirectoryIdentity({
        path,
        label: 'Deploy staging finalizer directory',
        signal,
      }),
    );
  }
  return Object.freeze(identities);
}

function sameDirectoryIdentity(
  left: t.DeployTool.Staging.DirectoryIdentity,
  right: t.DeployTool.Staging.DirectoryIdentity,
): boolean {
  return left.path === right.path && left.device === right.device && left.inode === right.inode;
}

function requireManifest(
  manifests: StagingManifestLedger,
  path: t.StringAbsoluteDir,
): StagingManifestRecord {
  const record = manifests.get(path);
  if (!record) throw new Error(`Deploy staging root manifest was not retained: ${path}`);
  return record;
}

function requireIdentity(
  identities: Map<t.StringAbsoluteDir, t.DeployTool.Staging.DirectoryIdentity>,
  path: string,
  label: string,
): t.DeployTool.Staging.DirectoryIdentity {
  const canonical: t.StringAbsoluteDir = Path.resolve(path, '.');
  const identity = identities.get(canonical);
  if (!identity) throw new Error(`Deploy staging ${label} was not retained: ${canonical}`);
  return identity;
}

function compareDeepestFirst(a: string, b: string): number {
  const depthA = depth(a);
  const depthB = depth(b);
  if (depthA !== depthB) return depthB - depthA;
  const natural = Str.Compare.natural()(a, b);
  return natural || Str.Compare.codeUnit()(a, b);
}

function depth(path: string): number {
  return path.replaceAll('\\', '/').split('/').filter(Boolean).length;
}

function isWithin(root: string, path: string): boolean {
  return Path.Is.within(root, path);
}

function unsafeManifest(path: string): Error {
  return new Error(`Deploy staging owned manifest changed before cleanup: ${path}`);
}
