import { Fs, Hash, Str, type t } from '../common.ts';
import { assertDirectoryIdentity } from './u.staging.identity.ts';

/** One exact manifest written or copied during the active staging generation. */
export type StagingManifestRecord = Readonly<{
  dir: t.StringAbsoluteDir;
  path: t.StringAbsolutePath;
  integrity: string;
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
  integrity: string;
}): StagingManifestRecord {
  const dir = args.directoryIdentity.path;
  const path: t.StringAbsolutePath = Fs.join(dir, 'dist.json');
  if (!args.integrity) {
    throw new Error(`Deploy staging manifest integrity was not produced: ${dir}`);
  }

  const record = Object.freeze({
    dir,
    path,
    integrity: args.integrity,
    directoryIdentity: args.directoryIdentity,
  });
  args.ledger.set(dir, record);
  return record;
}

/** Hash one admitted regular file without interpreting its payload. */
export async function stagingManifestIntegrity(
  path: t.StringAbsolutePath,
): Promise<string> {
  const info = await Fs.lstat(path);
  if (!info?.isFile || info.isSymlink) throw unsafeManifest(path);

  const read = await Fs.read(path);
  if (!read.ok || !read.exists || !read.data) throw unsafeManifest(path);
  return Hash.sha256(read.data);
}

/** Revalidate one retained directory and its exact manifest bytes. */
export async function validateStagingManifest(record: StagingManifestRecord): Promise<void> {
  await assertDirectoryIdentity(
    record.directoryIdentity,
    'Deploy staging manifest directory',
  );
  const integrity = await stagingManifestIntegrity(record.path);
  if (integrity !== record.integrity) throw unsafeManifest(record.path);
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
