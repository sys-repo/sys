import { type t, Fs, YamlConfig } from './common.ts';
import { PullFs, PullYamlSchema } from './u.yaml/mod.ts';

export type YamlConfigsMenuPick =
  | { readonly kind: 'exit' }
  | { readonly kind: 'selected'; readonly key: string };

type Action = 'select';

const ValidName = {
  hint: 'letters, numbers, ".", "_" or "-"',
  test(value: string) {
    return /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/.test(value);
  },
} as const;

export async function yamlConfigsMenu(cwd: t.StringDir): Promise<YamlConfigsMenuPick> {
  const schema = {
    init: () => PullYamlSchema.initial(),
    validate: (value: unknown) => PullYamlSchema.validate(value),
  } as const;

  const res = await YamlConfig.menu<t.PullTool.ConfigYaml.Doc, Action>({
    cwd,
    dir: PullFs.dir,
    label: 'Pull Config',
    itemLabel: 'config',
    addLabel: '   add: <config>',
    ensureDefault: false,
    schema,
    mode: 'select',
    selectAction: 'select',
    add: {
      message: 'Config name',
      hint: ValidName.hint,
      validate(value) {
        if (!ValidName.test(value)) return ValidName.hint;
        return true;
      },
      initYaml: () => PullFs.initialYaml(),
    },
  });

  if (res.kind === 'exit') return { kind: 'exit' };
  if (res.kind !== 'action' || res.action !== 'select') return { kind: 'exit' };
  return { kind: 'selected', key: nameFromPath(res.path) };
}

function nameFromPath(path: t.StringPath): string {
  const base = Fs.basename(path);
  return base.endsWith(PullFs.ext) ? base.slice(0, -PullFs.ext.length) : base;
}
