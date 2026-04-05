import { type t, Err, Fs, Path, SlcDataPipeline, Yaml } from './common.ts';
import { StageProfileSchema } from './schema/mod.ts';
import { StageProfileFs } from './u.fs.ts';

/**
 * Stage one profile file into the derived temp target.
 */
export async function runStageProfile(args: {
  cwd: t.StringDir;
  path: t.StringFile;
}): Promise<{ readonly kind: 'staged'; readonly dir: t.StringDir }> {
  const doc = await readProfile(args.path);
  const source = resolveSource(args.cwd, doc.source);
  const target = StageProfileFs.target(args.cwd, doc.mount);
  await SlcDataPipeline.stageFolder({ source, target, mount: doc.mount });
  return { kind: 'staged', dir: target };
}

/**
 * Helpers:
 */
async function readProfile(path: t.StringFile): Promise<t.SlcDataCli.StageProfile.Doc> {
  const raw = String((await Fs.readText(path)).data ?? '').trim();
  const parsed = Yaml.parse<unknown>(raw);
  if (parsed.error) throw parsed.error;
  const doc = parsed.data;
  const validation = StageProfileSchema.validate(doc);
  if (!validation.ok) {
    const detail = validation.errors.map((err) => Err.summary(err)).join(', ');
    throw new Error(`Invalid stage profile: ${path}${detail ? ` (${detail})` : ''}`);
  }
  return doc as t.SlcDataCli.StageProfile.Doc;
}

function resolveSource(cwd: t.StringDir, source: t.StringPath): t.StringPath {
  if (Path.Is.absolute(source)) return source;
  return Fs.join(cwd, source) as t.StringPath;
}
