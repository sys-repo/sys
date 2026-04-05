import { Args } from '@sys/cli';
import { Fs } from '@sys/fs';
import { type t, SlcDataCli as Cli } from '@tdb/slc-data/cli';

const SAMPLE_DATA_DIR = './public/data' as t.StringDir;

/** Stage package sample profiles into the local Vite-served public data folder. */
export async function run(args: {
  cwd?: t.StringDir;
  profile?: t.StringId;
} = {}) {
  const cwd = args.cwd ?? Deno.cwd() as t.StringDir;
  const profiles = args.profile ? [args.profile] : await wrangle.defaultProfiles(cwd);
  const publicData = wrangle.sampleData(cwd);

  await wrangle.reset(publicData);
  let result: { readonly kind: 'staged'; readonly dir: t.StringDir } | undefined;

  for (const profile of profiles) {
    result = await stageProfileToPublic({ cwd, profile });
  }

  if (!result) throw new Error('No sample profiles configured');
  console.info(result);
  return result;
}

export async function stageProfileToPublic(args: {
  cwd: t.StringDir;
  profile: t.StringId;
}): Promise<{ readonly kind: 'staged'; readonly dir: t.StringDir }> {
  const result = await Cli.StageProfile.stage({
    cwd: args.cwd,
    profile: args.profile,
    target: wrangle.sampleData(args.cwd),
  });
  await wrangle.ensureArtifacts(result.dir, args.profile);
  return result;
}

const wrangle = {
  async defaultProfiles(cwd: t.StringDir): Promise<t.StringId[]> {
    const dir = Cli.StageProfile.fs.configDir(cwd);
    const entries = await Array.fromAsync(Deno.readDir(dir));
    const profiles = entries
      .filter((entry) => entry.isFile && entry.name.endsWith('.yaml'))
      .map((entry) => entry.name.replace(/\.yaml$/, '').trim())
      .filter(Boolean)
      .sort()
      .map((value) => value as t.StringId);

    if (profiles.length === 0) throw new Error(`No stage profiles found in ${dir}`);
    return profiles;
  },

  async reset(...dirs: t.StringDir[]) {
    for (const dir of dirs) {
      if (await Fs.exists(dir)) await Fs.remove(dir);
    }
  },

  sampleData(cwd: t.StringDir): t.StringDir {
    return Fs.join(cwd, SAMPLE_DATA_DIR) as t.StringDir;
  },

  async ensureArtifacts(target: t.StringDir, profile: t.StringId) {
    const exists = (name: string, dir = 'manifests') => Fs.exists(Fs.join(target, dir, name));
    const ensure = async (name: string, dir = 'manifests') => {
      if (!(await exists(name, dir))) throw new Error(`missing ${name}`);
    };
    await ensure(`slug-tree.${profile}.json`);
    await ensure(`slug-tree.${profile}.yaml`);
    await ensure(`slug-tree.${profile}.assets.json`);
  },
} as const;

if (import.meta.main) {
  const args = Args.parse<{ profile?: string }>(Deno.args, { string: ['profile'] });
  await run({ profile: args.profile as t.StringId | undefined });
}
