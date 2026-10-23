import { Fs, Is, Obj, Schema, type t, Yaml } from '../common.ts';
import { tools as toolsSchema } from '../u.schema/s.tools.ts';
import { ProfilesFs } from '../u/u.fs.ts';

type MigrateItem = { from: t.StringPath; to: t.StringPath };
type MigrateResult = { migrated: MigrateItem[]; skipped: MigrateItem[] };

const EMPTY_RESULT: MigrateResult = { migrated: [], skipped: [] };
const ZIP_PATH = ['tools', 'zip'];
const ZIP_ENABLED_PATH = ['tools', 'zip', 'enabled'];

/** Add explicit read-only ZIP defaults without changing valid opt-outs or malformed tool policy. */
export const migrate06 = {
  async dir(cwd: t.StringDir): Promise<MigrateResult> {
    const dir = Fs.join(cwd, ProfilesFs.dir);
    if (!(await Fs.exists(dir))) return { ...EMPTY_RESULT };

    const files = await Fs.glob(dir, { includeDirs: false }).find(`*${ProfilesFs.ext}`);
    const migrated: MigrateItem[] = [];
    const skipped: MigrateItem[] = [];
    for (const entry of files) {
      const result = await migrate06.file(entry.path);
      migrated.push(...result.migrated);
      skipped.push(...result.skipped);
    }
    return { migrated, skipped };
  },

  async file(path: t.StringPath): Promise<MigrateResult> {
    const read = await Fs.readText(path);
    if (!read.ok || !read.data) return skipped(path);

    const ast = Yaml.parseAst(read.data);
    if (ast.errors?.length) return skipped(path);
    const parsed = Yaml.toJS<Record<string, unknown>>(ast);
    if (!parsed.ok || !Is.record(parsed.data)) return skipped(path);
    if (
      Obj.hasOwn(parsed.data, 'tools') && !Schema.Value.Check(toolsSchema, parsed.data.tools)
    ) return skipped(path);

    const tools = childRecord(parsed.data, 'tools');
    if (tools.kind === 'invalid') return skipped(path);
    if (tools.kind === 'missing') {
      return Yaml.path(ZIP_PATH).set(ast, defaultZipPolicy())
        ? await persist(path, ast)
        : skipped(path);
    }

    // JS conversion resolves aliases, while Yaml.path addresses literal scalar keys only.
    // Mutate only direct mappings so a new literal key cannot shadow aliased policy.
    const toolsNode = Yaml.path(['tools']).get(ast);
    if (!Yaml.Is.map(toolsNode)) return skipped(path);
    if (!Obj.hasOwn(tools.value, 'zip')) {
      return Yaml.path(ZIP_PATH).set(ast, defaultZipPolicy())
        ? await persist(path, ast)
        : skipped(path);
    }

    const zip = childRecord(tools.value, 'zip');
    if (zip.kind !== 'record') return skipped(path);
    if (Obj.hasOwn(zip.value, 'enabled')) return skipped(path);
    if (!Yaml.Is.map(Yaml.path(['tools', 'zip']).get(ast))) return skipped(path);

    return Yaml.path(ZIP_ENABLED_PATH).set(ast, true) ? await persist(path, ast) : skipped(path);
  },
} as const;

/**
 * Helpers:
 */
function defaultZipPolicy(): t.PiCliProfiles.Tools.Zip {
  return { enabled: true };
}

function childRecord(root: Record<string, unknown>, key: string) {
  if (!Obj.hasOwn(root, key)) return { kind: 'missing' as const, value: {} };
  const value = root[key];
  if (!Is.record(value)) return { kind: 'invalid' as const, value: {} };
  return { kind: 'record' as const, value };
}

async function persist(path: t.StringPath, ast: ReturnType<typeof Yaml.parseAst>) {
  await Fs.write(path, ast.toString(), { force: true });
  return { migrated: [{ from: path, to: path }], skipped: [] } satisfies MigrateResult;
}

function skipped(path: t.StringPath): MigrateResult {
  return { migrated: [], skipped: [{ from: path, to: path }] };
}
