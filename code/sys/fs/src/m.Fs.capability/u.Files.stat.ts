import { type t } from './common.ts';

/** Stat a path through `@sys/fs` and adapt metadata to FilesFs. */
export async function stat(
  fs: t.Fs.Lib,
  path: t.StringPath,
): Promise<t.FilesFs.Capability.Stat | undefined> {
  const info = await fs.stat(path);
  return info ? toFilesFsStat(info) : undefined;
}

const toFilesFsStat = (info: t.Fs.FileInfo): t.FilesFs.Capability.Stat => ({
  isFile: info.isFile,
  isDirectory: info.isDirectory,
  isSymlink: info.isSymlink,
  ...(info.isFile ? { size: info.size as t.NumberBytes } : {}),
});
