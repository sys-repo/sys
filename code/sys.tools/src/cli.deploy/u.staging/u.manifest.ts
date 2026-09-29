import { Fs, Hash, Path, Str, type t } from '../common.ts';
import { assertDirectoryIdentity } from './u.identity.ts';

/** One exact manifest written or copied during the active staging generation. */
export type StagingManifestRecord = Readonly<{
  dir: t.StringAbsoluteDir;
  path: t.StringAbsolutePath;
  manifestChecksum: t.StringHash;
  directoryIdentity: t.DeployTool.Staging.DirectoryIdentity;
}>;

/** Run-scoped manifest authority retained until success or leased rollback. */
export type StagingManifestLedger = Map<t.StringAbsoluteDir, StagingManifestRecord>;

/** Create one empty manifest ledger for an owned staging generation. */
export function createStagingManifestLedger(): StagingManifestLedger {
  return new Map<t.StringAbsoluteDir, StagingManifestRecord>();
}

/** Retain the exact bytes expected at one canonical directory's manifest path. */
export function retainStagingManifest(args: {
  ledger: StagingManifestLedger;
  directoryIdentity: t.DeployTool.Staging.DirectoryIdentity;
  manifestChecksum: t.StringHash;
}): StagingManifestRecord {
  const dir = args.directoryIdentity.path;
  const path: t.StringAbsolutePath = Fs.join(dir, 'dist.json');
  if (!args.manifestChecksum) {
    throw new Error(`Deploy staging manifest checksum was not produced: ${dir}`);
  }

  const record = Object.freeze({
    dir,
    path,
    manifestChecksum: args.manifestChecksum,
    directoryIdentity: args.directoryIdentity,
  });
  args.ledger.set(dir, record);
  return record;
}

/**
 * Publish complete bytes without clobbering a winner; only a committed write reports ownership.
 * The factory argument is an internal fault-test seam.
 */
export async function publishStagingManifest(
  path: t.StringAbsolutePath,
  bytes: Uint8Array,
  owned: (manifestChecksum: t.StringHash) => void,
  createRooted: t.FsRooted.Lib['create'] = Fs.Capability.Rooted.create,
): Promise<void> {
  const content = bytes.slice();
  const checksum = Hash.sha256(content);
  const rooted = await createRooted({ root: Path.dirname(path), create: false });
  const admission = await rooted.Target.admit([{ kind: 'file', path: Path.basename(path) }]);
  try {
    await rooted.File.publish(admission.targets[0], content);
  } catch (error) {
    const isCommittedPublish = Fs.Capability.Rooted.Is.failure(error) &&
      error.operation === 'publish-file' &&
      error.committed;

    // A committed publish linked the complete file, even if settlement failed.
    if (isCommittedPublish) {
      owned(checksum);
    }
    throw error;
  }
  owned(checksum);
}

/** Hash one admitted regular file without interpreting its payload. */
export async function stagingManifestChecksum(path: t.StringAbsolutePath): Promise<t.StringHash> {
  const info = await Fs.lstat(path);
  if (!info?.isFile || info.isSymlink) throw unsafeManifest(path);

  const read = await Fs.read(path);
  if (!read.ok || !read.exists || !read.data) throw unsafeManifest(path);
  return Hash.sha256(read.data);
}

/** Revalidate one retained directory and its exact manifest bytes. */
export async function validateStagingManifest(record: StagingManifestRecord): Promise<void> {
  await assertDirectoryIdentity(record.directoryIdentity, 'Deploy staging manifest directory');
  const checksum = await stagingManifestChecksum(record.path);
  if (checksum !== record.manifestChecksum) throw unsafeManifest(record.path);
}

/** Remove one unchanged, identity-bound manifest. */
export async function removeStagingManifest(record: StagingManifestRecord): Promise<void> {
  await validateStagingManifest(record);
  await Fs.remove(record.path, { log: false });
  if (await Fs.exists(record.path)) throw unsafeManifest(record.path);
}

/** Retract every unchanged manifest except an optional successful root record. */
export async function retractStagingManifests(
  ledger: StagingManifestLedger,
  options: { keepDir?: t.StringAbsoluteDir } = {},
): Promise<void> {
  const records = [...ledger.values()]
    .filter((record) => record.dir !== options.keepDir)
    .toSorted((a, b) => compareDeepestFirst(a.dir, b.dir));
  const failures: unknown[] = [];

  for (const record of records) {
    try {
      await removeStagingManifest(record);
      if (ledger.get(record.dir) === record) ledger.delete(record.dir);
    } catch (error) {
      failures.push(error);
    }
  }

  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    throw new AggregateError(failures, 'Deploy staging manifest retraction failed.');
  }
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

function unsafeManifest(path: string): Error {
  return new Error(`Deploy staging owned manifest changed before cleanup: ${path}`);
}
