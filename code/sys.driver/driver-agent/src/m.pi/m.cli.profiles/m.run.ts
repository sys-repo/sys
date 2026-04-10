import { Fs, type t } from './common.ts';
import { run as runCli } from '../m.cli/m.run.ts';
import { ProfilesFs } from './u.fs.ts';

export const run: t.PiCliProfiles.Lib['run'] = async (input) => {
  const cwd = input.cwd ?? Fs.cwd('terminal');
  const config = Fs.resolve(cwd, input.config) as t.StringPath;
  const checked = await ProfilesFs.validateYaml(config);
  if (!checked.ok) throw new Error(`Could not load profile config: ${Fs.trimCwd(config)}`);

  const profile = resolveProfile(checked.doc, input.profile);
  const args = [...(profile.args ?? []), ...(input.args ?? [])];
  const read = [...(profile.read ?? []), ...(input.read ?? [])] as readonly t.StringPath[];
  const env = { ...(profile.env ?? {}), ...(input.env ?? {}) };

  return await runCli({
    cwd,
    args,
    read,
    env,
    pkg: input.pkg,
  });
};

function resolveProfile(
  doc: t.PiCliProfiles.Yaml.ProfileSet,
  name?: string,
): t.PiCliProfiles.Yaml.Profile {
  if (name) {
    const found = doc.profiles.find((profile) => profile.name === name);
    if (!found) throw new Error(`Profile not found: ${name}`);
    return found;
  }

  const fallback = doc.profiles.find((profile) => profile.name === 'default') ?? doc.profiles[0];
  if (!fallback) throw new Error('Profile config is empty.');
  return fallback;
}
