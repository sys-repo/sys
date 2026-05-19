import { type t } from './common.ts';

/** Walk a directory through `@sys/fs` and adapt entries to the readonly Files capability. */
export async function* walk(
  fs: t.Fs.Lib,
  path: t.StringPath,
): AsyncIterable<t.FsCapability.Files.WalkEntry> {
  const root = fs.Path.resolve(path);
  for await (const entry of fs.walk(path)) {
    if (fs.Path.resolve(entry.path) === root) continue;
    yield {
      path: entry.path,
      isFile: entry.isFile,
      isDirectory: entry.isDirectory,
    };
  }
}
