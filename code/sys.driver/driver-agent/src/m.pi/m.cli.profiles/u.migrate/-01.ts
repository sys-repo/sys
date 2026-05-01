import { Fs, Is, type t, Yaml } from '../common.ts';
import { ProfilesFs } from '../u.fs.ts';

type MigrateItem = { from: t.StringPath; to: t.StringPath };
type MigrateResult = { migrated: MigrateItem[]; skipped: MigrateItem[] };

const EMPTY_RESULT: MigrateResult = { migrated: [], skipped: [] };
const INCLUDE_PATH = ['sandbox', 'context', 'include'];
const APPEND_PATH = ['sandbox', 'context', 'append'];

/**
 * Migration 01:
 * - normalize legacy generated `sandbox.context.include` to `sandbox.context.append`.
 */
export const migrate01 = {
  async dir(cwd: t.StringDir): Promise<MigrateResult> {
    const dir = Fs.join(cwd, ProfilesFs.dir);
    if (!(await Fs.exists(dir))) return { ...EMPTY_RESULT };

    const files = await Fs.glob(dir, { includeDirs: false }).find(`*${ProfilesFs.ext}`);
    const migrated: MigrateItem[] = [];
    const skipped: MigrateItem[] = [];

    for (const entry of files) {
      const res = await migrate01.file(entry.path as t.StringPath);
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

    const context = toContextRecord(js.data);
    if (!context) return skipped(path);
    if (!hasOwn(context, 'include')) return skipped(path);

    const include = context.include;
    if (!Array.isArray(include)) return skipped(path);

    if (!hasOwn(context, 'append')) {
      Yaml.path(APPEND_PATH).set(ast, include);
    }
    Yaml.path(INCLUDE_PATH).set(ast, undefined);

    await Fs.write(path, ast.toString(), { force: true });
    return { migrated: [{ from: path, to: path }], skipped: [] };
  },
} as const;

function toContextRecord(root: Record<string, unknown>) {
  const sandbox = Is.record(root.sandbox) ? root.sandbox : undefined;
  if (!sandbox) return undefined;
  return Is.record(sandbox.context) ? sandbox.context : undefined;
}

function skipped(path: t.StringPath): MigrateResult {
  return { migrated: [], skipped: [{ from: path, to: path }] };
}

function hasOwn(input: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key);
}
