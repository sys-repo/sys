import { type t, c, Fs } from './common.ts';
import { YamlConfig } from '@sys/yaml/cli';
import type { YamlConfigMenuExtra, YamlConfigMenuItemArgs } from '@sys/yaml/t';
import { LintProfileSchema } from './u.lint.schema.ts';

const PROFILE_DIR = '-slug.lint';
const PROFILE_EXT = '.yaml';
const DEFAULT_PROFILE = 'default';

type Action = 'facets' | 'run';

export type SlugLintProfilePick =
  | { kind: 'exit' }
  | { kind: 'back'; profile?: t.StringFile }
  | { kind: 'run'; profile: t.StringFile }
  | { kind: 'facets'; profile: t.StringFile };

export async function selectSlugLintProfile(
  cwd: t.StringDir,
  opts: { interactive?: boolean; defaultProfile?: t.StringFile } = {},
): Promise<SlugLintProfilePick> {
  const profiles = await ensureProfiles(cwd);
  if (!opts.interactive) return { kind: 'run', profile: profiles[0] };

  const res = await YamlConfig.menu<t.LintProfileDoc, Action>({
    cwd,
    dir: PROFILE_DIR,
    label: 'Lint profiles',
    itemLabel: 'lint',
    addLabel: 'add: <profile>',
    schema: schema,
    invalid: { label: 'invalid yaml' },
    actions: { extra: extraActions() },
    defaultPath: opts.defaultProfile,
  });

  return toProfilePick(res, opts.defaultProfile);
}

export async function selectSlugLintProfileAction(
  cwd: t.StringDir,
  profile: t.StringFile,
  opts: { defaultAction?: Action } = {},
): Promise<SlugLintProfilePick> {
  const res = await YamlConfig.menu<t.LintProfileDoc, Action>({
    cwd,
    dir: PROFILE_DIR,
    label: 'Lint profiles',
    itemLabel: 'lint',
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
  init: () => LintProfileSchema.initial(),
  validate: (value: unknown) => LintProfileSchema.validate(value),
  stringifyYaml: (doc: t.LintProfileDoc) => LintProfileSchema.stringify(doc),
} as const;

function extraActions(): YamlConfigMenuExtra<Action>[] {
  return [
    { name: ({ name }: YamlConfigMenuItemArgs) => `run ${c.cyan(name)}`, value: 'run' },
    { name: 'facets', value: 'facets' },
  ];
}

function toProfilePick(
  res: Awaited<ReturnType<typeof YamlConfig.menu>>,
  fallback?: t.StringFile,
): SlugLintProfilePick {
  if (res.kind === 'exit') return { kind: 'exit' };
  if (res.kind === 'back') return { kind: 'back', profile: fallback };
  if (res.kind === 'action') {
    if (res.action === 'run') return { kind: 'run', profile: res.path };
    if (res.action === 'facets') return { kind: 'facets', profile: res.path };
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
    await Fs.write(path, LintProfileSchema.initialYaml());
    files.push(path);
  }
  return files;
}
