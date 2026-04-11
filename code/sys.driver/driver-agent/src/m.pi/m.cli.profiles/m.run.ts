import { Fs, type t } from './common.ts';
import { run as runCli } from '../m.cli/m.run.ts';
import { ProfilesFs } from './u.fs.ts';

export const run: t.PiCliProfiles.Lib['run'] = async (input) => {
  const cwd = input.cwd ?? Fs.cwd('terminal');
  const config = Fs.resolve(cwd, input.config) as t.StringPath;
  const checked = await ProfilesFs.validateYaml(config);
  if (!checked.ok) throw new Error(`Could not load profile config: ${Fs.trimCwd(config)}`);

  const profile = checked.doc;
  const args = [...(profile.args ?? []), ...(input.args ?? [])];
  const capability = profile.sandbox?.capability;
  const context = profile.sandbox?.context;
  const read = [
    ...(capability?.read ?? []),
    ...(context?.include ?? []),
    ...(input.read ?? []),
  ] as readonly t.StringPath[];
  const write = [...(capability?.write ?? []), ...(input.write ?? [])] as readonly t.StringPath[];
  const env = { ...(capability?.env ?? {}), ...(input.env ?? {}) };

  return await runCli({
    cwd,
    args,
    read,
    write,
    env,
    pkg: input.pkg,
  });
};
