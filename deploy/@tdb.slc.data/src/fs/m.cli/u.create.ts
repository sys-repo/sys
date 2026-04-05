import { Fs, type t } from './common.ts';
import { StageProfileSchema } from './schema/mod.ts';
import { StageProfileFs } from './u.fs.ts';

/**
 * Create one stage profile file.
 */
export async function runCreateProfile(args: {
  cwd: t.StringDir;
  profile: t.StringId;
  source: t.StringPath;
}): Promise<t.SlcDataCli.StageProfile.CreateResult> {
  const { cwd, profile, source } = args;
  const path = StageProfileFs.path(cwd, profile);
  const doc = StageProfileSchema.initial(profile);
  const yaml = StageProfileSchema.stringify({ ...doc, source });
  await Fs.write(path, yaml);
  return { kind: 'created', path };
}
