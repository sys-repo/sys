import { Fs, Path, type t } from '../common.ts';
import { shouldExclude } from '../u.exclude.ts';
import { reservedGeneratedNameOf } from '../u.endpoints/u.pathPolicy.ts';
import { throwIfStagingCancelled } from './u.cancel.ts';
import { assertDirectoryIdentity, ensureStagingDirectory } from './u.identity.ts';
import {
  publishStagingManifest,
  retainStagingManifest,
  stagingManifestChecksum,
  type StagingManifestLedger,
  validateStagingManifest,
} from './u.manifest.ts';

type Args = {
  src: string;
  dst: string;
  sourceIdentity: t.DeployTool.Staging.DirectoryIdentity;
  destinationIdentity: t.DeployTool.Staging.DirectoryIdentity;
  manifestLedger: StagingManifestLedger;
  signal?: AbortSignal;
};

/** Internal copy seam: report exact owned bytes, never ownership inferred from a failed copy. */
type Copy = (
  from: string,
  to: string,
  options: t.Fs.CopyFileOptions,
  owned: (manifestChecksum: t.StringHash) => void,
) => Promise<t.Fs.CopyResult>;

/**
 * Copy one admitted source directory into one retained, disjoint staging destination.
 * Root identities detect cooperative replacement; pathname descendants do not claim hostile
 * same-user isolation. The copy dependency is an internal fault-proof seam.
 */
export async function copyInto(args: Args, copy: Copy = copyWithOwnership): Promise<void> {
  await assertCopyRoots(args);

  const entries = Fs.walk(args.sourceIdentity.path, {
    includeDirs: true,
    includeFiles: true,
    includeSymlinks: true,
    followSymlinks: false,
  });
  for await (const entry of entries) {
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
      await copyFile(args, entry.path, target, copy);
      continue;
    }
    throw unsupportedSource(entry.path);
  }

  await assertCopyRoots(args);
}

/** Manifest partial writes stay private to Rooted; public collision bytes never become ours. */
export const copyWithOwnership: Copy = async (from, to, options, owned) => {
  if (Path.basename(to) !== 'dist.json') return await Fs.copyFile(from, to, options);
  const read = await Fs.read(from);
  if (!read.ok || !read.data) {
    throw read.error ?? new Error(`Cannot read staging manifest: ${from}`);
  }
  await publishStagingManifest(to, read.data, owned);
  return {};
};

/**
 * Helpers:
 */
async function copyFile(args: Args, source: string, target: string, copy: Copy): Promise<void> {
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
  let ownedChecksum: t.StringHash | undefined;
  let copied: t.Fs.CopyResult;
  try {
    copied = await copy(
      source,
      target,
      { ensureParent: false, force: false, throw: true },
      (checksum) => {
        if (isManifest) ownedChecksum = checksum;
      },
    );
  } catch (error) {
    return await rethrowCopyFailure(
      args.manifestLedger,
      parentIdentity,
      target,
      ownedChecksum,
      error,
    );
  }
  if (copied.error) {
    await rethrowCopyFailure(
      args.manifestLedger,
      parentIdentity,
      target,
      ownedChecksum,
      copied.error,
    );
  }

  if (isManifest && !ownedChecksum) {
    throw new Error(`Deploy staging manifest copy did not establish ownership: ${target}`);
  }
  const manifest = ownedChecksum
    ? retainStagingManifest({
      ledger: args.manifestLedger,
      directoryIdentity: parentIdentity,
      manifestChecksum: ownedChecksum,
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
  ownedChecksum: t.StringHash | undefined,
  failure: unknown,
): Promise<never> {
  if (ownedChecksum) {
    try {
      if (await Fs.lstat(target)) {
        const manifestChecksum = await stagingManifestChecksum(target);
        if (manifestChecksum !== ownedChecksum) {
          throw new Error(`Deploy staging owned manifest changed before cleanup: ${target}`);
        }
        retainStagingManifest({ ledger, directoryIdentity, manifestChecksum: ownedChecksum });
      }
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

async function assertCopyRoots(args: Args): Promise<void> {
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
