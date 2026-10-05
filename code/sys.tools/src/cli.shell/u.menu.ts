import { c, Cli, D, Fmt } from './common.ts';

export type ShellMenuAction =
  | 'doctor'
  | 'init:dry-run'
  | 'alias:list'
  | 'alias:enable/sys/dry-run'
  | 'alias:enable/common/dry-run'
  | 'path:list'
  | 'path:add/deno/dry-run'
  | 'back';

export type ShellMenuOption = {
  readonly name: string;
  readonly value: ShellMenuAction;
};

type ShellMenuPick =
  | { readonly kind: 'back' }
  | { readonly kind: 'command'; readonly argv: readonly string[] };

type ShellCommandAction = Exclude<ShellMenuAction, 'back'>;
export type ShellCommandItem = ShellMenuOption & {
  readonly value: ShellCommandAction;
  readonly argv: readonly string[];
};

/** Prompt for shell-tool actions when launched from the root interactive menu. */
export async function shellMenu(): Promise<ShellMenuPick> {
  const picked = await Cli.Input.Select.prompt<ShellMenuAction>({
    message: c.green(D.tool.name),
    options: [...shellMenuOptions()],
    hideDefault: true,
  });

  if (picked === 'back') return { kind: 'back' };

  const argv = commandArgv(picked);
  if (argv) return { kind: 'command', argv };

  throw new Error(`Invalid shell menu action: ${picked}`);
}

/** Build the shell submenu options. */
export function shellMenuOptions(): readonly ShellMenuOption[] {
  return [
    ...shellMenuItems().map(({ name, value }) => ({ name, value })),
    { name: backName(), value: 'back' },
  ];
}

/** Build the shell submenu command descriptors. */
export function shellMenuItems(): readonly ShellCommandItem[] {
  const dim = (value: string) => c.gray(c.dim(value));

  return [
    {
      name: '  doctor                 diagnose shell profile health',
      value: 'doctor',
      argv: ['doctor'],
    },
    {
      name: '  alias list             show managed alias state',
      value: 'alias:list',
      argv: ['alias', 'list'],
    },
    {
      name: '  path list              show managed PATH state',
      value: 'path:list',
      argv: ['path', 'list'],
    },
    {
      name: dim('  init --dry-run         preview recommended baseline'),
      value: 'init:dry-run',
      argv: ['init', '--dry-run'],
    },
    {
      name: dim('  alias enable sys       preview sys alias'),
      value: 'alias:enable/sys/dry-run',
      argv: ['alias', 'enable', 'sys', '--dry-run'],
    },
    {
      name: dim('  alias enable common    preview common aliases'),
      value: 'alias:enable/common/dry-run',
      argv: ['alias', 'enable', 'common', '--dry-run'],
    },
    {
      name: dim('  path add deno          preview Deno PATH block'),
      value: 'path:add/deno/dry-run',
      argv: ['path', 'add', 'deno', '--dry-run'],
    },
  ];
}

function commandArgv(value: string): readonly string[] | undefined {
  return shellMenuItems().find((item) => item.value === value)?.argv;
}

function backName(): string {
  return Fmt.back();
}
