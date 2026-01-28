import { c, Cli, Is } from './common.ts';
import type {
  YamlConfigMenuActionBase,
  YamlConfigMenuItemName,
  YamlConfigMenuItemArgs,
} from './t.menu.ts';

type PromptActionArgs<A extends string, T> = {
  name: string;
  path: string;
  doc?: T;
  valid: boolean;
  invalidLabel?: string;
  allow?: YamlConfigMenuActionBase[];
  defaultValue?: YamlConfigMenuActionBase | A;
  extra?: { name: YamlConfigMenuItemName<T>; value: A }[];
};

export async function promptAction<A extends string = string, T = unknown>(
  args: PromptActionArgs<A, T>,
): Promise<YamlConfigMenuActionBase | A> {
  const extras = args.extra ?? [];
  const base = [
    { name: '  config: edit', value: 'edit' },
    { name: '  config: reload', value: 'reload' },
    { name: '  config: rename', value: 'rename' },
    { name: c.dim(c.gray(' (delete)')), value: 'delete' },
    { name: `${c.cyan('←')} back`, value: 'back' },
  ];

  const all = [
    ...extras.map((item) => ({
      name: `  ${resolveName(item.name, { name: args.name, path: args.path, doc: args.doc })}`,
      value: item.value,
    })),
    ...base,
  ];

  const allowed = args.valid
    ? all
    : all.filter((opt) =>
        (args.allow ?? ['edit', 'reload', 'rename', 'delete', 'back']).includes(
          opt.value as YamlConfigMenuActionBase,
        ),
      );

  const answer = await Cli.Input.Select.prompt<YamlConfigMenuActionBase | A>({
    message: args.valid ? 'Actions:' : `Actions: ${c.yellow(args.invalidLabel ?? 'invalid yaml')}`,
    options: allowed,
    default: args.defaultValue,
    hideDefault: true,
  });
  return answer as YamlConfigMenuActionBase | A;
}

function resolveName<T>(name: YamlConfigMenuItemName<T>, args: YamlConfigMenuItemArgs<T>) {
  return Is.func(name) ? name(args) : name;
}
