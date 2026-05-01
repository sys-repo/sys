import { c, Cli, Is } from './common.ts';
import type {
  YamlConfigMenuActionBase,
  YamlConfigMenuItemArgs,
  YamlConfigMenuItemName,
} from './t.menu.ts';

type PromptActionArgs<A extends string, T> = {
  name: string;
  path: string;
  doc?: T;
  valid: boolean;
  invalidLabel?: string;
  allow?: YamlConfigMenuActionBase[];
  defaultValue?: YamlConfigMenuActionBase | A;
  message?: string;
  actionLabel?: string;
  extra?: { name: YamlConfigMenuItemName<T>; value: A }[];
  extraAfter?: { name: YamlConfigMenuItemName<T>; value: A }[];
};

export async function promptAction<A extends string = string, T = unknown>(
  args: PromptActionArgs<A, T>,
): Promise<YamlConfigMenuActionBase | A> {
  const extraActions = resolveExtras(args.extra ?? [], args);
  const extraAfterActions = resolveExtras(args.extraAfter ?? [], args);
  const actionLabel = String(args.actionLabel ?? 'config').trim() || 'config';
  const baseActions = [
    { name: `${actionLabel}: edit`, value: 'edit' },
    { name: `${actionLabel}: reload`, value: 'reload' },
    { name: `${actionLabel}: rename`, value: 'rename' },
  ];
  const base = [
    ...extraActions.map((item) => ({ name: `  ${item.name}`, value: item.value })),
    ...baseActions.map((item) => ({ name: `  ${item.name}`, value: item.value })),
    ...extraAfterActions.map((item) => ({ name: `  ${item.name}`, value: item.value })),
    { name: c.dim(c.gray(' (delete)')), value: 'delete' },
    { name: `${c.cyan('←')} back`, value: 'back' },
  ];

  const all = base;

  const allowed = args.valid
    ? all
    : all.filter((opt) =>
      (args.allow ?? ['edit', 'reload', 'rename', 'delete', 'back']).includes(
        opt.value as YamlConfigMenuActionBase,
      )
    );

  const answer = await Cli.Input.Select.prompt<YamlConfigMenuActionBase | A>({
    message: args.valid
      ? args.message ?? 'Actions:'
      : `${args.message ?? 'Actions:'} ${c.yellow(args.invalidLabel ?? 'invalid yaml')}`,
    options: allowed,
    default: args.defaultValue,
    hideDefault: true,
  });
  return answer as YamlConfigMenuActionBase | A;
}

function resolveExtras<A extends string, T>(
  extras: { name: YamlConfigMenuItemName<T>; value: A }[],
  args: PromptActionArgs<A, T>,
) {
  return extras.map((item) => ({
    name: resolveName(item.name, { name: args.name, path: args.path, doc: args.doc }),
    value: item.value,
  }));
}

function resolveName<T>(name: YamlConfigMenuItemName<T>, args: YamlConfigMenuItemArgs<T>) {
  return Is.func(name) ? name(args) : name;
}
