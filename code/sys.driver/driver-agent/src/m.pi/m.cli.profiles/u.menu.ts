import { Cli, type t, YamlConfig } from './common.ts';
import { ProfilesFs } from './u.fs.ts';
import { ProfileSetSchema } from './u.schema.ts';

type Action = 'select';

const ValidName = {
  hint: 'letters, numbers, ".", "_" or "-"',
  test(name: string) {
    return /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/.test(name);
  },
} as const;

export const menu: t.PiCliProfiles.Lib['menu'] = async ({ cwd }) => {
  const schema = {
    init: () => ProfileSetSchema.initial(),
    validate: (value: unknown) => ProfileSetSchema.validate(value),
  } as const;

  const res = await YamlConfig.menu<t.PiCliProfiles.Yaml.ProfileSet, Action>({
    cwd,
    dir: ProfilesFs.dir,
    label: 'Environment Profiles',
    itemLabel: 'profiles',
    addLabel: ' add: <profile>',
    ensureDefault: false,
    schema,
    mode: 'select',
    selectAction: 'select',
    add: {
      message: 'Profile name',
      hint: ValidName.hint,
      validate(value) {
        if (!ValidName.test(value)) return ValidName.hint;
        return true;
      },
      initYaml: ({ name }) => ProfilesFs.initialYaml(name),
    },
  });

  if (res.kind === 'exit') return { kind: 'exit' };
  if (res.kind !== 'action' || res.action !== 'select') return { kind: 'exit' };

  const checked = await ProfilesFs.validateYaml(res.path);
  if (!checked.ok) return { kind: 'exit' };

  const names = checked.doc.profiles.map((profile) => profile.name);
  const profile = await Cli.Input.Select.prompt<string>({
    message: 'Profile:\n',
    options: [
      ...names.map((name) => ({ name, value: name })),
      { name: '(exit)', value: 'exit' },
    ],
    default: names[0],
    hideDefault: true,
  });

  if (profile === 'exit') return { kind: 'exit' };
  return { kind: 'selected', config: res.path, profile };
};
