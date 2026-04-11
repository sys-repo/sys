import { c, type t, YamlConfig } from './common.ts';
import { ProfilesFs } from './u.fs.ts';
import { ProfileSchema } from './u.schema.ts';

type Action = 'run';

const ValidName = {
  hint: 'letters, numbers, ".", "_" or "-"',
  test(name: string) {
    return /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/.test(name);
  },
} as const;

export const menu: t.PiCliProfiles.Lib['menu'] = async ({ cwd }) => {
  const schema = {
    init: () => ProfileSchema.initial(),
    validate: (value: unknown) => ProfileSchema.validate(value),
  } as const;

  const res = await YamlConfig.menu<t.PiCliProfiles.Yaml.Profile, Action>({
    cwd,
    dir: ProfilesFs.dir,
    label: 'Agent',
    itemLabel: 'profiles',
    addLabel: ' add: <profile>',
    defaultName: 'default',
    schema,
    actions: {
      message: 'Agent:',
      extra: [{ name: c.green('start'), value: 'run' }],
    },
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
  if (res.kind !== 'action' || res.action !== 'run') return { kind: 'exit' };

  return { kind: 'selected', config: res.path };
};
