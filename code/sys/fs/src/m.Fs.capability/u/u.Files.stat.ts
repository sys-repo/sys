import { type t } from '../common.ts';

/** Stat a path through `@sys/fs`, preserving the readonly Files absence contract. */
export async function stat(
  fs: t.Fs.Lib,
  path: t.StringPath,
): Promise<t.FsCapability.Files.Stat | undefined> {
  try {
    const info = await fs.stat(path);
    return info ? toFilesStat(info) : undefined;
  } catch {
    return undefined;
  }
}

export const toFilesStat = (info: t.Fs.FileInfo): t.FsCapability.Files.Stat => ({
  isFile: info.isFile,
  isDirectory: info.isDirectory,
  isSymlink: info.isSymlink,
  ...(info.isFile ? { size: info.size as t.NumberBytes } : {}),
});
