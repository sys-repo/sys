import { type t, c, Fs, pkg, Str } from './common.ts';
import { YamlConfig } from '@sys/yaml/cli';
import type { YamlConfigMenuExtra, YamlConfigMenuItemArgs } from '@sys/yaml/t';
import { BundleProfileSchema } from './schema/mod.ts';

const PROFILE_DIR = Fs.join('-config', pkg.name, 'bundle');
const PROFILE_EXT = '.yaml';
const DEFAULT_PROFILE = 'default';

export async function selectBundleProfile(
  cwd: t.StringDir,
  opts: { interactive?: boolean; defaultProfile?: t.StringFile } = {},
): Promise<t.BundleProfilePick> {
  const profiles = await ensureProfiles(cwd);
  if (!opts.interactive) return { kind: 'run', profile: profiles[0] };

  const res = await YamlConfig.menu<t.BundleProfile, t.BundleProfileAction>({
    cwd,
    dir: PROFILE_DIR,
    label: 'Bundle profiles',
    itemLabel: 'bundle',
    addLabel: 'add: <profile>',
    schema: schema,
    invalid: { label: 'invalid yaml' },
    actions: { extra: extraActions() },
    defaultPath: opts.defaultProfile,
  });

  return toProfilePick(res, opts.defaultProfile);
}

export async function selectBundleProfileAction(
  cwd: t.StringDir,
  profile: t.StringFile,
  opts: { defaultAction?: t.BundleProfileAction } = {},
): Promise<t.BundleProfilePick> {
  const res = await YamlConfig.menu<t.BundleProfile, t.BundleProfileAction>({
    cwd,
    dir: PROFILE_DIR,
    label: 'Bundle profiles',
    itemLabel: 'bundle',
    addLabel: '  add: <profile>',
    schema: schema,
    invalid: { label: 'invalid yaml' },
    actions: { extra: extraActions() },
    mode: 'action',
    path: profile,
    defaultAction: opts.defaultAction,
  });

  return toProfilePick(res, profile);
}

const schema = {
  init: () => BundleProfileSchema.initial(),
  validate: (value: unknown) => BundleProfileSchema.validate(value),
  stringifyYaml: (doc: t.BundleProfile) => BundleProfileSchema.stringify(doc),
} as const;

function extraActions(): YamlConfigMenuExtra<t.BundleProfileAction, t.BundleProfile>[] {
  return [
    {
      name: ({ name, doc }: YamlConfigMenuItemArgs<t.BundleProfile>) => {
        const count = doc?.bundles?.length ?? 0;
        const suffix = c.gray(c.dim(` → (${count} ${Str.plural(count, 'config')})`));
        return `run ${c.cyan(name)}${suffix}`;
      },
      value: 'run',
    },
  ];
}

function toProfilePick(
  res: Awaited<ReturnType<typeof YamlConfig.menu>>,
  fallback?: t.StringFile,
): t.BundleProfilePick {
  if (res.kind === 'exit') return { kind: 'exit' };
  if (res.kind === 'back') return { kind: 'back', profile: fallback };
  if (res.kind === 'action') {
    if (res.action === 'run') return { kind: 'run', profile: res.path };
  }
  return { kind: 'back', profile: fallback };
}

async function ensureProfiles(cwd: t.StringDir): Promise<t.StringFile[]> {
  const dir = Fs.join(cwd, PROFILE_DIR);
  await Fs.ensureDir(dir);

  const files: t.StringFile[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (!entry.isFile) continue;
    if (!entry.name.endsWith(PROFILE_EXT)) continue;
    files.push(Fs.join(dir, entry.name));
  }
  if (files.length === 0) {
    const path = Fs.join(dir, `${DEFAULT_PROFILE}${PROFILE_EXT}`);
    await Fs.write(path, BundleProfileSchema.stringify(BundleProfileSchema.initial()));
    files.push(path);
  }
  return files;
}
