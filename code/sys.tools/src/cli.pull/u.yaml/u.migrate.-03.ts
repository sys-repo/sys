import { type t, Fs, Is, Yaml } from '../common.ts';
import { PullFs } from './u.fs.ts';

/**
 * Migration 03:
 * - flatten bundle source from `remote.{ kind, dist }` to top-level `{ kind, dist }`.
 */
export async function migrate03(
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
    const groups: t.DeepMutable<Record<string, unknown>[]>[] = [];
    if (Array.isArray(root.remoteBundles)) groups.push(root.remoteBundles as t.DeepMutable<Record<string, unknown>[]>);
    if (Array.isArray(root.bundles)) groups.push(root.bundles as t.DeepMutable<Record<string, unknown>[]>);
    if (groups.length === 0) {
      skipped.push({ from: path, to: path });
      continue;
    }

    let changed = false;
    for (const bundles of groups) {
      for (const bundle of bundles) {
        if (!Is.record(bundle)) continue;
        const remote = Is.record(bundle.remote) ? bundle.remote : undefined;
        if (!remote) continue;

        const kind = Is.str(remote.kind) ? remote.kind : undefined;
        const dist = Is.str(remote.dist) ? remote.dist : undefined;
        if (!kind || !dist) continue;

        if (!Is.str(bundle.kind)) {
          bundle.kind = kind;
          changed = true;
        }
        if (!Is.str(bundle.dist)) {
          bundle.dist = dist;
          changed = true;
        }
        delete bundle.remote;
        changed = true;
      }
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
