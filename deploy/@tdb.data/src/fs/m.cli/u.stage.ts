import { type t, Fs, Path, SlugDataPipeline, Yaml } from './common.ts';
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
  onProgress?: (info: t.SlugDataPipeline.StageSlugDataset.Progress) => void;
}): Promise<t.SlugDataCli.StageProfile.StageResult> {
  const doc = await readProfile(args.path);
  const dirs: t.StringDir[] = [];

  for (const mapping of doc.mappings) {
    const staged = await stageMapping({ cwd: args.cwd, mapping, target: args.target, onProgress: args.onProgress });
    dirs.push(...staged);
  }

  return { kind: 'staged', dirs };
}

export async function runStageProfileMapping(args: {
  cwd: t.StringDir;
  path: t.StringFile;
  index: number;
  target?: t.StringDir;
  onProgress?: (info: t.SlugDataPipeline.StageSlugDataset.Progress) => void;
}): Promise<t.SlugDataCli.StageProfile.StageResult> {
  const doc = await readProfile(args.path);
  const mapping = doc.mappings[args.index];
  if (!mapping) throw new Error(`Stage mapping index out of range: ${args.index}`);
  const dirs = await stageMapping({ cwd: args.cwd, mapping, target: args.target, onProgress: args.onProgress });
  return { kind: 'staged', dirs };
}

/**
 * Helpers:
 */
export async function readProfile(path: t.StringFile): Promise<t.SlugDataCli.StageProfile.Doc> {
  const raw = String((await Fs.readText(path)).data ?? '').trim();
  const parsed = Yaml.parse<unknown>(raw);
  if (parsed.error) throw parsed.error;
  const doc = parsed.data;
  const validation = StageProfileSchema.validate(doc);
  if (!validation.ok) {
    const detail = Fmt.validationErrors(validation.errors);
    throw new Error(`Invalid stage profile: ${path}${detail ? ` (${detail})` : ''}`);
  }
  return doc as t.SlugDataCli.StageProfile.Doc;
}

async function stageMapping(args: {
  cwd: t.StringDir;
  mapping: t.SlugDataCli.StageProfile.Mapping;
  target?: t.StringDir;
  onProgress?: (info: t.SlugDataPipeline.StageSlugDataset.Progress) => void;
}): Promise<readonly t.StringDir[]> {
  const source = resolveSource(args.cwd, args.mapping.source);
  if (args.mapping.kind === 'slug-dataset') {
    const root = args.target ?? StageProfileFs.targetRoot(args.cwd);
    const result = await SlugDataPipeline.stageSlugDataset({
      source: source as t.StringDir,
      root,
      progress: args.onProgress,
    });
    return result.dirs;
  }

  const mount = args.mapping.mount;
  const target = args.target ? (Fs.join(args.target, mount) as t.StringDir) : StageProfileFs.target(args.cwd, mount);
  await SlugDataPipeline.stageFolder({ source, target, mount });
  return [target];
}

function resolveSource(cwd: t.StringDir, source: t.StringPath): t.StringPath {
  if (Path.Is.absolute(source)) return source;
  return Fs.join(cwd, source) as t.StringPath;
}
