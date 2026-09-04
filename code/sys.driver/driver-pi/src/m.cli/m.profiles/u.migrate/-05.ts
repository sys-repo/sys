import { Fs, Is, type t, Yaml } from '../common.ts';
import { ProfilesFs } from '../u/u.fs.ts';

type MigrateItem = { from: t.StringPath; to: t.StringPath };
type MigrateResult = { migrated: MigrateItem[]; skipped: MigrateItem[] };

const EMPTY_RESULT: MigrateResult = { migrated: [], skipped: [] };
const MOVE_PATH = ['tools', 'move'];
const COPY_PATH = ['tools', 'copy'];
const COPY_ENABLED_PATH = ['tools', 'copy', 'enabled'];

/**
 * Migration 05:
 * - add explicit `tools.move` and `tools.copy` defaults for discoverability.
 * - default bounded move/rename and copy/import to enabled while preserving explicit disabled policy.
 */
export const migrate05 = {
  async dir(cwd: t.StringDir): Promise<MigrateResult> {
    const dir = Fs.join(cwd, ProfilesFs.dir);
    if (!(await Fs.exists(dir))) return { ...EMPTY_RESULT };

    const files = await Fs.glob(dir, { includeDirs: false }).find(`*${ProfilesFs.ext}`);
    const migrated: MigrateItem[] = [];
    const skipped: MigrateItem[] = [];

    for (const entry of files) {
      const res = await migrate05.file(entry.path as t.StringPath);
      migrated.push(...res.migrated);
      skipped.push(...res.skipped);
    }

    return { migrated, skipped };
  },

  async file(path: t.StringPath): Promise<MigrateResult> {
    const read = await Fs.readText(path);
    if (!read.ok || !read.data) return skipped(path);

    const ast = Yaml.parseAst(read.data);
    if (ast.errors?.length) return skipped(path);

    const js = Yaml.toJS<Record<string, unknown>>(ast);
    if (!js.ok || !Is.record(js.data)) return skipped(path);

    const tools = childRecord(js.data, 'tools');
    if (tools.kind !== 'record') return skipped(path);

    let changed = false;
    if (!hasOwn(tools.value, 'move')) {
      Yaml.path(MOVE_PATH).set(ast, defaultMovePolicy());
      changed = true;
    } else if (!Is.record(tools.value.move)) {
      return skipped(path);
    }

    if (!hasOwn(tools.value, 'copy')) {
      Yaml.path(COPY_PATH).set(ast, defaultCopyPolicy());
      changed = true;
    } else if (!Is.record(tools.value.copy)) {
      return skipped(path);
    } else if (!hasOwn(tools.value.copy, 'enabled')) {
      Yaml.path(COPY_ENABLED_PATH).set(ast, true);
      changed = true;
    }

    if (!changed) return skipped(path);

    await Fs.write(path, ast.toString(), { force: true });
    return { migrated: [{ from: path, to: path }], skipped: [] };
  },
} as const;

/**
 * Helpers:
 */
function defaultMovePolicy(): t.PiCliProfiles.Tools.Move {
  return { enabled: true };
}

function defaultCopyPolicy(): t.PiCliProfiles.Tools.Copy {
  return { enabled: true };
}

function childRecord(root: Record<string, unknown>, key: string) {
  if (!hasOwn(root, key)) return { kind: 'missing' as const };
  const value = root[key];
  if (!Is.record(value)) return { kind: 'invalid' as const };
  return { kind: 'record' as const, value };
}

function skipped(path: t.StringPath): MigrateResult {
  return { migrated: [], skipped: [{ from: path, to: path }] };
}

function hasOwn(input: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key);
}
