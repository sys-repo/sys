import { Fs, Path, type t } from '../common.ts';
import { shouldExclude } from '../u.exclude.ts';
import { reservedGeneratedNameOf } from '../u.endpoints/u.pathPolicy.ts';
import { throwIfStagingCancelled } from './u.staging.cancel.ts';
import { assertDirectoryIdentity, ensureStagingDirectory } from './u.staging.identity.ts';
import {
  retainStagingManifest,
  stagingManifestIntegrity,
  type StagingManifestLedger,
  validateStagingManifest,
} from './u.staging.manifest.ts';

/**
 * Copy one admitted source directory into one retained, disjoint staging destination.
 * Root identities detect cooperative replacement; pathname descendants do not claim hostile
 * same-user isolation.
 */
export async function copyInto(args: {
  src: string;
  dst: string;
  sourceIdentity: t.DeployTool.Staging.DirectoryIdentity;
  destinationIdentity: t.DeployTool.Staging.DirectoryIdentity;
  manifestLedger: StagingManifestLedger;
  signal?: AbortSignal;
}): Promise<void> {
  await assertCopyRoots(args);

  for await (
    const entry of Fs.walk(args.sourceIdentity.path, {
      includeDirs: true,
      includeFiles: true,
      includeSymlinks: true,
      followSymlinks: false,
    })
  ) {
    throwIfStagingCancelled(args.signal);
    const relative = Path.relative(args.sourceIdentity.path, entry.path);
    if (
      Path.Is.absolute(relative) ||
      !Path.Is.within(args.sourceIdentity.path, entry.path)
    ) {
      throw unsupportedSource(entry.path);
    }
    if (!relative || shouldExclude(entry.path)) continue;

    const target = Fs.join(args.destinationIdentity.path, relative);
    const sourceInfo = await Fs.lstat(entry.path);
    if (entry.isSymlink || sourceInfo?.isSymlink) throw unsupportedSource(entry.path);
    const basename = Path.basename(entry.path);
    const reservedName = reservedGeneratedNameOf(basename);
    if (reservedName && (basename !== reservedName || !sourceInfo?.isFile)) {
      throw unsupportedSource(entry.path);
    }

    if (entry.isDirectory && sourceInfo?.isDirectory) {
      await ensureStagingDirectory({
        root: args.destinationIdentity,
        path: target,
        label: 'Deploy staging copy destination',
        signal: args.signal,
      });
      continue;
    }

    if (entry.isFile && sourceInfo?.isFile) {
      await copyFile(args, entry.path, target);
      continue;
    }
    throw unsupportedSource(entry.path);
  }

  await assertCopyRoots(args);
}

async function copyFile(
  args: {
    src: string;
    dst: string;
    sourceIdentity: t.DeployTool.Staging.DirectoryIdentity;
    destinationIdentity: t.DeployTool.Staging.DirectoryIdentity;
    manifestLedger: StagingManifestLedger;
    signal?: AbortSignal;
  },
  source: string,
  target: string,
): Promise<void> {
  if (shouldExclude(source)) return;
  await assertCopyRoots(args);
  const parentIdentity = await ensureStagingDirectory({
    root: args.destinationIdentity,
    path: Path.dirname(target),
    label: 'Deploy staging copy destination parent',
    signal: args.signal,
  });

  if (await Fs.lstat(target)) {
    throw new Error(`Deploy staging destination collision: ${target}`);
  }

  const basename = Path.basename(source);
  const reservedName = reservedGeneratedNameOf(basename);
  if (reservedName && basename !== reservedName) throw unsupportedSource(source);
  const isManifest = reservedName === 'dist.json';
  const copied = await Fs.copyFile(source, target, {
    ensureParent: false,
    force: false,
    throw: true,
  }).catch((error) =>
    rethrowCopyFailure(args.manifestLedger, parentIdentity, target, isManifest, error)
  );
  if (copied.error) {
    await rethrowCopyFailure(
      args.manifestLedger,
      parentIdentity,
      target,
      isManifest,
      copied.error,
    );
  }

  const manifestIntegrity = isManifest
    ? await stagingManifestIntegrity(Path.resolve(target, '.'))
    : undefined;
  const manifest = manifestIntegrity
    ? retainStagingManifest({
      ledger: args.manifestLedger,
      directoryIdentity: parentIdentity,
      integrity: manifestIntegrity,
    })
    : undefined;
  const observed = await Fs.lstat(target);
  if (!observed?.isFile || observed.isSymlink) {
    throw new Error(`Deploy staging copied file is unsafe: ${target}`);
  }
  if (manifest) await validateStagingManifest(manifest);
  await assertCopyRoots(args);
}

async function rethrowCopyFailure(
  ledger: StagingManifestLedger,
  directoryIdentity: t.DeployTool.Staging.DirectoryIdentity,
  target: t.StringAbsolutePath,
  isManifest: boolean,
  failure: unknown,
): Promise<never> {
  if (isManifest && await Fs.lstat(target)) {
    try {
      const integrity = await stagingManifestIntegrity(target);
      retainStagingManifest({ ledger, directoryIdentity, integrity });
    } catch (retentionError) {
      throw new AggregateError(
        [failure, retentionError],
        'Deploy staging manifest copy failed and its resulting bytes could not be retained.',
        { cause: failure },
      );
    }
  }
  throw failure;
}

async function assertCopyRoots(args: {
  src: string;
  dst: string;
  sourceIdentity: t.DeployTool.Staging.DirectoryIdentity;
  destinationIdentity: t.DeployTool.Staging.DirectoryIdentity;
  manifestLedger: StagingManifestLedger;
  signal?: AbortSignal;
}): Promise<void> {
  throwIfStagingCancelled(args.signal);
  if (Path.resolve(args.src, '.') !== args.sourceIdentity.path) {
    throw new Error(`Deploy staging copy source identity does not match: ${args.src}`);
  }
  if (Path.resolve(args.dst, '.') !== args.destinationIdentity.path) {
    throw new Error(`Deploy staging copy destination identity does not match: ${args.dst}`);
  }
  await assertDirectoryIdentity(
    args.sourceIdentity,
    'Deploy staging mapping source',
    args.signal,
  );
  await assertDirectoryIdentity(
    args.destinationIdentity,
    'Deploy staging mapping destination',
    args.signal,
  );
}

function unsupportedSource(path: string): Error {
  return new Error(`Deploy staging source contains an unsupported entry: ${path}`);
}
