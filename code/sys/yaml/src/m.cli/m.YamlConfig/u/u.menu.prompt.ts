import { c, Cli, Is, type t } from '../common.ts';

type PromptRootAction<A extends string> =
  | t.YamlConfig.Menu.ActionBase
  | A
  | typeof SUBMENU_VALUE;

type PromptActionArgs<A extends string, T> = {
  name: string;
  path: string;
  doc?: T;
  valid: boolean;
  invalidLabel?: string;
  allow?: t.YamlConfig.Menu.ActionBase[];
  defaultValue?: t.YamlConfig.Menu.ActionBase | A;
  message?: string;
  actionLabel?: t.YamlConfig.Menu.ItemName<T>;
  labelMode?: 'prefix' | 'submenu';
  extra?: { name: t.YamlConfig.Menu.ItemName<T>; value: A }[];
  extraAfter?: { name: t.YamlConfig.Menu.ItemName<T>; value: A }[];
};

const SUBMENU_VALUE = Symbol('YamlConfig.Menu.submenu');
const DEFAULT_ALLOWED: t.YamlConfig.Menu.ActionBase[] = [
  'edit',
  'reload',
  'rename',
  'delete',
  'back',
];

export async function promptAction<A extends string = string, T = unknown>(
  args: PromptActionArgs<A, T>,
): Promise<t.YamlConfig.Menu.ActionBase | A> {
  const extraActions = resolveExtras(args.extra ?? [], args);
  const extraAfterActions = resolveExtras(args.extraAfter ?? [], args);
  const itemArgs = { name: args.name, path: args.path, doc: args.doc };
  const actionLabel = resolveName(args.actionLabel ?? 'config', itemArgs).trim() || 'config';
  const baseActions = [
    { name: 'edit', value: 'edit' as const },
    { name: 'reload', value: 'reload' as const },
    { name: 'rename', value: 'rename' as const },
  ];
  const deleteAction = { name: c.dim(c.gray(' (delete)')), value: 'delete' as const };
  const backAction = { name: `${c.cyan('←')} back`, value: 'back' as const };
  const message = args.valid
    ? args.message ?? 'Actions:'
    : `${args.message ?? 'Actions:'} ${c.yellow(args.invalidLabel ?? 'invalid yaml')}`;

  if (args.labelMode !== 'submenu') {
    const all = [
      ...extraActions.map((item) => ({ name: `  ${item.name}`, value: item.value })),
      ...baseActions.map((item) => ({
        name: `  ${actionLabel}: ${item.name}`,
        value: item.value,
      })),
      ...extraAfterActions.map((item) => ({ name: `  ${item.name}`, value: item.value })),
      deleteAction,
      backAction,
    ];
    const allowed = args.valid ? all : all.filter((opt) =>
      (args.allow ?? DEFAULT_ALLOWED).includes(
        opt.value as t.YamlConfig.Menu.ActionBase,
      )
    );

    const answer = await Cli.Input.Select.prompt<t.YamlConfig.Menu.ActionBase | A>({
      message,
      options: allowed,
      default: args.defaultValue,
      hideDefault: true,
    });
    return answer as t.YamlConfig.Menu.ActionBase | A;
  }

  const allowedBaseActions = args.valid
    ? baseActions
    : baseActions.filter((opt) => (args.allow ?? DEFAULT_ALLOWED).includes(opt.value));
  const submenuOptions = [
    ...allowedBaseActions.map((item) => ({ name: `  ${item.name}`, value: item.value })),
    backAction,
  ].filter((opt) =>
    args.valid ||
    (args.allow ?? DEFAULT_ALLOWED).includes(opt.value as t.YamlConfig.Menu.ActionBase)
  );
  const rootOptions = [
    ...extraActions.map((item) => ({ name: `  ${item.name}`, value: item.value })),
    ...(allowedBaseActions.length > 0 ? [{ name: `  ${actionLabel}`, value: SUBMENU_VALUE }] : []),
    ...extraAfterActions.map((item) => ({ name: `  ${item.name}`, value: item.value })),
    deleteAction,
    backAction,
  ].filter((opt) =>
    args.valid || opt.value === SUBMENU_VALUE ||
    (args.allow ?? DEFAULT_ALLOWED).includes(opt.value as t.YamlConfig.Menu.ActionBase)
  );

  const startsInSubmenu = allowedBaseActions.some((item) => item.value === args.defaultValue);
  let level: 'root' | 'submenu' = startsInSubmenu ? 'submenu' : 'root';
  let rootDefault = startsInSubmenu ? SUBMENU_VALUE : args.defaultValue;
  let submenuDefault = startsInSubmenu ? args.defaultValue : undefined;

  while (true) {
    if (level === 'submenu') {
      const answer = await Cli.Input.Select.prompt<string>({
        message,
        options: submenuOptions,
        default: submenuDefault,
        hideDefault: true,
      });
      if (answer !== 'back') return answer as t.YamlConfig.Menu.ActionBase | A;
      level = 'root';
      rootDefault = SUBMENU_VALUE;
      continue;
    }

    const answer = await Cli.Input.Select.prompt<PromptRootAction<A>>({
      message,
      options: rootOptions,
      default: rootDefault,
      hideDefault: true,
    });
    if (answer !== SUBMENU_VALUE) return answer as t.YamlConfig.Menu.ActionBase | A;
    level = 'submenu';
    submenuDefault = undefined;
  }
}

function resolveExtras<A extends string, T>(
  extras: { name: t.YamlConfig.Menu.ItemName<T>; value: A }[],
  args: PromptActionArgs<A, T>,
) {
  return extras.map((item) => ({
    name: resolveName(item.name, { name: args.name, path: args.path, doc: args.doc }),
    value: item.value,
  }));
}

function resolveName<T>(name: t.YamlConfig.Menu.ItemName<T>, args: t.YamlConfig.Menu.ItemArgs<T>) {
  return Is.func(name) ? name(args) : name;
}
