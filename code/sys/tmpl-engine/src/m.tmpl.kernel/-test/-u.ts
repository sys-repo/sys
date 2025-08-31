import { type t, FileMap, Fs, Path } from '../../-test.ts';

/**
 * Test Helpers:
 */
export const tmpDir = (prefix: string) => Fs.makeTempDir({ prefix }).then((d) => d.absolute);

export const listRelative = async (dir: string) => {
  const root = Path.resolve(dir);
  const out: string[] = [];
  for await (const e of Fs.walk(root)) if (e.isFile) out.push(e.path.slice(root.length + 1));
  return out.sort();
};

export const encode = (path: t.StringPath, text: string) =>
  FileMap.Data.encode(FileMap.Data.contentType.fromPath(path), text);

/**
 * (Example) Per-run file processor for tests.
 */
export function makeProcessFile({ bundleRoot }: { bundleRoot?: t.StringDir } = {}) {
  return (e: any) => {
    const root = (bundleRoot ?? '').trim();
    if (!root) return;

    const prefix = `${root}/`;
    const isUnderRoot = e.path === root || e.path.startsWith(prefix);

    // 1) exclude anything outside the root
    if (!isUnderRoot) {
      return e.exclude(`excluded: not within "${root}/"`);
    }

    // 2) compute the final relative path (strip root if present)
    let rel = e.path.startsWith(prefix) ? e.path.slice(prefix.length) : e.path;
    if (!rel) return e.exclude('excluded: empty path after strip');

    // 3) special-case rename: ".gitignore-" → ".gitignore"
    if (rel.endsWith('.gitignore-')) rel = rel.replace(/-$/, '');

    // 4) apply exactly one rename to the computed target-relative path
    return e.target.rename(rel);
  };
}
