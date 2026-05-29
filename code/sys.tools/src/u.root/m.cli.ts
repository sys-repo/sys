import { Is, type t } from './common.ts';
import { parseArgs, toRootDispatchArgv } from './u.args.ts';
import type { UpgradeAdvisoryState } from '../cli.upgrade/u.advisory.ts';
import type { RootUpgradeAdvisoryOptions } from './u.upgradeAdvisory.policy.ts';

type CliDeps = {
  readonly printRootHelp?: (args: t.Root.CliRootParsedArgs) => unknown;
  readonly prepareRootUpgradeAdvisory?: (
    options?: RootUpgradeAdvisoryOptions,
  ) => Promise<UpgradeAdvisoryState>;
  readonly rootMenu?: (args: { highlightUpgrade?: boolean }) => Promise<
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

  const prepareRootUpgradeAdvisory = deps.prepareRootUpgradeAdvisory ??
    (await import('./u.upgradeAdvisory.ts')).prepareRootUpgradeAdvisory;
  const info = deps.info ?? console.info;

  let advisory: UpgradeAdvisoryState;
  const advisoryOptions = { noUpgradeCheck: args.noUpgradeCheck } as const;
  try {
    advisory = await prepareRootUpgradeAdvisory(advisoryOptions);
    try {
      if (advisory.prelude) info(advisory.prelude);
    } catch {
      // Advisory display must never block the selected tool.
    }
  } catch {
    advisory = emptyUpgradeAdvisoryState;
  }

  if (args.command) {
    await dispatchRootCommand(cwd, args.command, toRootDispatchArgv(argv, args), {
      origin: 'argv',
    });
    return;
  }

  const rootMenu = deps.rootMenu ?? (await import('./u.menu.ts')).rootMenu;
  while (true) {
    const picked = await rootMenu({ highlightUpgrade: advisory.hasUpgrade });
    if (picked.kind === 'exit') return;

    const result = await dispatchRootCommand(cwd, picked.command, [picked.command], {
      origin: 'root-menu',
    });
    if (isBackResult(result)) continue;
    return;
  }
}

const emptyUpgradeAdvisoryState: UpgradeAdvisoryState = {
  path: undefined,
  record: undefined,
  hasUpgrade: false,
  prelude: undefined,
};

function isBackResult(value: unknown): value is { readonly kind: 'back' } {
  return Is.record(value) && value.kind === 'back';
}
