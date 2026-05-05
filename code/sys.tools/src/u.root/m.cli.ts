import { Is, type t } from './common.ts';
import { parseArgs, toRootDispatchArgv } from './u.args.ts';
import type { UpdateAdvisoryState } from '../cli.update/u.advisory.ts';
import type { RootUpdateAdvisoryOptions } from './u.updateAdvisory.policy.ts';

type CliDeps = {
  readonly printRootHelp?: (args: t.Root.CliRootParsedArgs) => unknown;
  readonly prepareRootUpdateAdvisory?: (
    options?: RootUpdateAdvisoryOptions,
  ) => Promise<UpdateAdvisoryState>;
  readonly rootMenu?: (args: { highlightUpdate?: boolean }) => Promise<
    { kind: 'exit' } | { kind: 'selected'; command: t.Root.Command }
  >;
  readonly dispatchRootCommand?: (
    cwd: t.StringDir,
    command: t.Root.Command,
    argv: readonly string[],
    context: t.Root.ToolCliContext,
  ) => Promise<unknown>;
  readonly info?: (...data: unknown[]) => void;
};

export async function cli(cwd: t.StringDir, argv: string[], deps: CliDeps = {}) {
  const args = parseArgs(argv);
  const dispatchRootCommand = deps.dispatchRootCommand ??
    (await import('./u.dispatcher.ts')).dispatchRootCommand;

  if (args.help && !args.command) {
    const printRootHelp = deps.printRootHelp ?? (await import('./u.help.ts')).printRootHelp;
    printRootHelp(args);
    return;
  }

  const prepareRootUpdateAdvisory = deps.prepareRootUpdateAdvisory ??
    (await import('./u.updateAdvisory.ts')).prepareRootUpdateAdvisory;
  const info = deps.info ?? console.info;

  let advisory: UpdateAdvisoryState;
  const advisoryOptions = { noUpdateCheck: args.noUpdateCheck } as const;
  try {
    advisory = await prepareRootUpdateAdvisory(advisoryOptions);
    try {
      if (advisory.prelude) info(advisory.prelude);
    } catch {
      // Advisory display must never block the selected tool.
    }
  } catch {
    advisory = emptyUpdateAdvisoryState;
  }

  if (args.command) {
    await dispatchRootCommand(cwd, args.command, toRootDispatchArgv(argv, args), {
      origin: 'argv',
    });
    return;
  }

  const rootMenu = deps.rootMenu ?? (await import('./u.menu.ts')).rootMenu;
  while (true) {
    const picked = await rootMenu({ highlightUpdate: advisory.hasUpdate });
    if (picked.kind === 'exit') return;

    const result = await dispatchRootCommand(cwd, picked.command, [picked.command], {
      origin: 'root-menu',
    });
    if (isBackResult(result)) continue;
    return;
  }
}

const emptyUpdateAdvisoryState: UpdateAdvisoryState = {
  path: undefined,
  record: undefined,
  hasUpdate: false,
  prelude: undefined,
};

function isBackResult(value: unknown): value is { readonly kind: 'back' } {
  return Is.record(value) && value.kind === 'back';
}
