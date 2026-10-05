import { Fs, type t, YamlConfig } from '../common.ts';
import { ProfilesFs } from './u.fs.ts';

type ProfileSelection = ProfilePathSelection | ProfileNameSelection;

type ProfilePathSelection = {
  readonly kind: 'path';
  readonly config: t.StringPath;
};

type ProfileNameSelection = {
  readonly kind: 'name';
  readonly name: string;
  readonly config: t.StringPath;
};

export const ProfileConfig = {
  async resolveSelection(root: t.StringDir, value: string): Promise<ProfileSelection> {
    const selection = resolveProfileSelector(root, value);
    if (selection.kind === 'name') await prepareNamedProfileConfig(selection);
    return selection;
  },
} as const;

/**
 * Helpers:
 */

function resolveProfileSelector(root: t.StringDir, value: string): ProfileSelection {
  const ref = YamlConfig.Ref.resolve({
    value,
    dir: Fs.join(root, ProfilesFs.dir) as t.StringDir,
    ext: ProfilesFs.ext,
    label: '--profile',
    errorPrefix: 'Pi profiles',
    expandTilde: true,
  });

  if (ref.kind === 'path') {
    return { kind: 'path', config: ref.path };
  }

  return {
    kind: 'name',
    name: ref.name,
    config: ref.path,
  };
}

async function prepareNamedProfileConfig(selection: ProfileNameSelection) {
  if (selection.name === 'default') {
    await ProfilesFs.ensureInitialYaml(selection.config);
    return;
  }

  if (!(await Fs.exists(selection.config))) {
    const part1 = `Profile config not found: ${Fs.trimCwd(selection.config)}. `;
    const part2 = `Named profiles are not created implicitly`;
    const part3 = `create it from the profile menu first.`;
    throw new Error(`${part1} ${part2} ${part3}`);
  }
}
