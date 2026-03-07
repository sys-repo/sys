import { type t, Fs, Is, Yaml } from '../common.ts';
import { PullFs } from './u.fs.ts';

/**
 * Migration 02:
 * - add `remote.kind: "http"` for legacy bundles with `remote.dist`.
 */
export async function migrate02(
  cwd: t.StringDir,
): Promise<t.YamlConfig.Migrate.DirResult> {
  const dir = Fs.join(cwd, PullFs.dir);
  if (!(await Fs.exists(dir))) return { migrated: [], skipped: [] };

  const files = await Fs.glob(dir, { includeDirs: false }).find(`*${PullFs.ext}`);
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
    const bundles = Array.isArray(root.remoteBundles)
      ? (root.remoteBundles as t.DeepMutable<Record<string, unknown>[]>)
      : undefined;
    if (!bundles || bundles.length === 0) {
      skipped.push({ from: path, to: path });
      continue;
    }

    let changed = false;
    for (const bundle of bundles) {
      if (!Is.record(bundle)) continue;
      const remote = Is.record(bundle.remote) ? bundle.remote : undefined;
      if (!remote) continue;
      if (remote.kind === 'http') continue;
      if (!Is.str(remote.dist) || !remote.dist.trim()) continue;
      remote.kind = 'http';
      changed = true;
    }

    if (!changed) {
      skipped.push({ from: path, to: path });
      continue;
    }

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
