import { type t, Fs, Is, Yaml } from '../common.ts';
import { ServeFs } from './u.fs.ts';

/**
 * Migration 03:
 * - remove legacy top-level `remoteBundles` from serve YAML docs.
 */
export async function migrate03(
  cwd: t.StringDir,
): Promise<t.YamlConfig.Migrate.DirResult> {
  const dir = Fs.join(cwd, ServeFs.dir);
  if (!(await Fs.exists(dir))) return { migrated: [], skipped: [] };

  const files = await Fs.glob(dir, { includeDirs: false }).find(`*${ServeFs.ext}`);
  const migrated: Array<{ from: t.StringPath; to: t.StringPath }> = [];
  const skipped: Array<{ from: t.StringPath; to: t.StringPath }> = [];

  for (const entry of files) {
    const path = entry.path;
    const read = await Fs.readText(path);
    if (!read.ok || !read.data) {
      skipped.push({ from: path, to: path });
      continue;
    }

    const parsed = Yaml.parse<Record<string, unknown>>(read.data);
    if (parsed.error || !parsed.data || !Is.record(parsed.data)) {
      skipped.push({ from: path, to: path });
      continue;
    }

    const root = { ...parsed.data } as t.DeepMutable<Record<string, unknown>>;
    if (!Object.hasOwn(root, 'remoteBundles')) {
      skipped.push({ from: path, to: path });
      continue;
    }

    delete root.remoteBundles;
    const next = Yaml.stringify(root);
    if (next.error || !next.data) {
      skipped.push({ from: path, to: path });
      continue;
    }

    await Fs.write(path, next.data, { force: true });
    migrated.push({ from: path, to: path });
  }

  return { migrated, skipped };
}
