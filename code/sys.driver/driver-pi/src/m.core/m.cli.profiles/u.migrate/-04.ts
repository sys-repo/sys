import { Fs, Is, type t, Yaml } from '../common.ts';
import { ProfilesFs } from '../u.fs.ts';

type MigrateItem = { from: t.StringPath; to: t.StringPath };
type MigrateResult = { migrated: MigrateItem[]; skipped: MigrateItem[] };

const EMPTY_RESULT: MigrateResult = { migrated: [], skipped: [] };
const REMOVE_PATH = ['tools', 'remove'];
const ENABLED_PATH = ['tools', 'remove', 'enabled'];
const RECURSIVE_PATH = ['tools', 'remove', 'recursive'];

/**
 * Migration 04:
 * - add explicit disabled `tools.remove` defaults to existing profiles for discoverability.
 * - default recursive directory cleanup to true once the tool is explicitly enabled.
 * - never enable the destructive remove tool by migration.
 */
export const migrate04 = {
  async dir(cwd: t.StringDir): Promise<MigrateResult> {
    const dir = Fs.join(cwd, ProfilesFs.dir);
    if (!(await Fs.exists(dir))) return { ...EMPTY_RESULT };

    const files = await Fs.glob(dir, { includeDirs: false }).find(`*${ProfilesFs.ext}`);
    const migrated: MigrateItem[] = [];
    const skipped: MigrateItem[] = [];

    for (const entry of files) {
      const res = await migrate04.file(entry.path as t.StringPath);
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
    if (tools.kind === 'invalid') return skipped(path);

    if (tools.kind === 'missing') {
      Yaml.path(REMOVE_PATH).set(ast, defaultRemovePolicy());
      await Fs.write(path, ast.toString(), { force: true });
      return { migrated: [{ from: path, to: path }], skipped: [] };
    }

    const remove = childRecord(toMutableRecord(tools.value), 'remove');
    if (remove.kind === 'invalid') return skipped(path);

    if (remove.kind === 'missing') {
      Yaml.path(REMOVE_PATH).set(ast, defaultRemovePolicy());
      await Fs.write(path, ast.toString(), { force: true });
      return { migrated: [{ from: path, to: path }], skipped: [] };
    }

    let changed = false;
    if (!hasOwn(remove.value, 'enabled')) {
      Yaml.path(ENABLED_PATH).set(ast, false);
      changed = true;
    }
    if (!hasOwn(remove.value, 'recursive')) {
      Yaml.path(RECURSIVE_PATH).set(ast, true);
      changed = true;
    } else if (remove.value.enabled !== true && remove.value.recursive === false) {
      Yaml.path(RECURSIVE_PATH).set(ast, true);
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
function defaultRemovePolicy(): t.PiCliProfiles.Tools.Remove {
  return { enabled: false, recursive: true };
}

function childRecord(root: Record<string, unknown>, key: string) {
  if (!hasOwn(root, key)) return { kind: 'missing' as const };
  const value = root[key];
  if (!Is.record(value)) return { kind: 'invalid' as const };
  return { kind: 'record' as const, value };
}

function toMutableRecord(input: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return input as Record<string, unknown>;
}

function skipped(path: t.StringPath): MigrateResult {
  return { migrated: [], skipped: [{ from: path, to: path }] };
}

function hasOwn(input: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key);
}
