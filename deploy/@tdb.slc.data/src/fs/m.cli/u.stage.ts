import { type t, Fs, Path, SlcDataPipeline, Yaml } from './common.ts';
import { StageProfileSchema } from './schema/mod.ts';
import { Fmt } from './u.fmt.ts';
import { StageProfileFs } from './u.fs.ts';

/**
 * Stage one profile file into the derived temp target.
 */
export async function runStageProfile(args: {
  cwd: t.StringDir;
  path: t.StringFile;
  target?: t.StringDir;
}): Promise<t.SlcDataCli.StageProfile.StageResult> {
  const doc = await readProfile(args.path);
  const dirs: t.StringDir[] = [];

  for (const mapping of doc.mappings) {
    const dir = await stageMapping({ cwd: args.cwd, mapping, target: args.target });
    dirs.push(dir);
  }

  return { kind: 'staged', dirs };
}

export async function runStageProfileMapping(args: {
  cwd: t.StringDir;
  path: t.StringFile;
  index: number;
  target?: t.StringDir;
}): Promise<{ readonly kind: 'staged'; readonly dir: t.StringDir }> {
  const doc = await readProfile(args.path);
  const mapping = doc.mappings[args.index];
  if (!mapping) throw new Error(`Stage mapping index out of range: ${args.index}`);
  const dir = await stageMapping({ cwd: args.cwd, mapping, target: args.target });
  return { kind: 'staged', dir };
}

/**
 * Helpers:
 */
export async function readProfile(path: t.StringFile): Promise<t.SlcDataCli.StageProfile.Doc> {
  const raw = String((await Fs.readText(path)).data ?? '').trim();
  const parsed = Yaml.parse<unknown>(raw);
  if (parsed.error) throw parsed.error;
  const doc = parsed.data;
  const validation = StageProfileSchema.validate(doc);
  if (!validation.ok) {
    const detail = Fmt.validationErrors(validation.errors);
    throw new Error(`Invalid stage profile: ${path}${detail ? ` (${detail})` : ''}`);
  }
  return doc as t.SlcDataCli.StageProfile.Doc;
}

async function stageMapping(args: {
  cwd: t.StringDir;
  mapping: t.SlcDataCli.StageProfile.Mapping;
  target?: t.StringDir;
}): Promise<t.StringDir> {
  const source = resolveSource(args.cwd, args.mapping.source);
  const target = args.target
    ? (Fs.join(args.target, args.mapping.mount) as t.StringDir)
    : StageProfileFs.target(args.cwd, args.mapping.mount);
  await SlcDataPipeline.stageFolder({ source, target, mount: args.mapping.mount });
  return target;
}

function resolveSource(cwd: t.StringDir, source: t.StringPath): t.StringPath {
  if (Path.Is.absolute(source)) return source;
  return Fs.join(cwd, source) as t.StringPath;
}
