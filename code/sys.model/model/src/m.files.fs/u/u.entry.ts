import { type t } from '../common.ts';
import type * as TCapability from '../t/t.capability.ts';
import { fail } from './u.error.ts';

export const entryFromStat = (
  path: t.Files.String.Path,
  stat: TCapability.Stat,
): t.Files.Entry => {
  const kind = stat.kind ?? (stat.isFile ? 'file' : stat.isDirectory ? 'dir' : undefined);
  if (kind === undefined) {
    throw fail('FilesFsError.Unsupported', `Unsupported Files entry: ${path}`);
  }

  const base = {
    path,
    kind,
    ...(stat.modifiedAt === undefined ? {} : { modifiedAt: stat.modifiedAt }),
    ...(stat.hash === undefined ? {} : { hash: stat.hash }),
  };

  if (kind === 'dir') return base;

  return {
    ...base,
    kind: 'file',
    ...(stat.size === undefined ? {} : { size: stat.size }),
    ...(stat.mediaType === undefined ? {} : { mediaType: stat.mediaType }),
  };
};

export const statFromWalkEntry = (
  entry: TCapability.WalkEntry,
): TCapability.Stat => {
  return {
    kind: entry.kind,
    isFile: entry.isFile,
    isDirectory: entry.isDirectory,
    ...entry.stat,
  };
};
