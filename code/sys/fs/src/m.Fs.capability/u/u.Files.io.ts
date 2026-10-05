import { type t } from '../common.ts';

/** Resolve a real path, preserving the readonly Files not-found/unreadable-as-undefined contract. */
export async function realPath(
  fs: t.Fs.Lib,
  path: t.StringPath,
): Promise<t.StringAbsolutePath | undefined> {
  try {
    return await fs.realPath(path) as t.StringAbsolutePath;
  } catch {
    return undefined;
  }
}

/** Read UTF-8 text, preserving the readonly Files not-found/unreadable-as-undefined contract. */
export async function readText(fs: t.Fs.Lib, path: t.StringPath): Promise<string | undefined> {
  try {
    const res = await fs.readText(path);
    return res.ok ? res.data : undefined;
  } catch {
    return undefined;
  }
}
