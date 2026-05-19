import { type t } from './common.ts';

/** Stat a path through `@sys/fs` and adapt metadata to the readonly Files capability. */
export async function stat(
  fs: t.Fs.Lib,
  path: t.StringPath,
): Promise<t.FsCapability.Files.Stat | undefined> {
  const info = await fs.stat(path);
  return info ? toFilesStat(info) : undefined;
}

const toFilesStat = (info: t.Fs.FileInfo): t.FsCapability.Files.Stat => ({
  isFile: info.isFile,
  isDirectory: info.isDirectory,
  isSymlink: info.isSymlink,
  ...(info.isFile ? { size: info.size as t.NumberBytes } : {}),
});
