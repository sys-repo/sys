import { type t } from './common.ts';

/** Resolve a real path, preserving FilesFs' not-found-as-undefined contract. */
export async function realPath(
  fs: t.Fs.Lib,
  path: t.StringPath,
): Promise<t.StringAbsolutePath | undefined> {
  try {
    return await fs.realPath(path) as t.StringAbsolutePath;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return undefined;
    throw error;
  }
}

/** Read UTF-8 text, preserving FilesFs' not-found/unreadable-as-undefined contract. */
export async function readText(fs: t.Fs.Lib, path: t.StringPath): Promise<string | undefined> {
  const res = await fs.readText(path);
  return res.ok ? res.data : undefined;
}
