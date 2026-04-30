import { Is } from '@sys/std/is';
import { type t } from './common.ts';
import { parseArgs } from './u.args.ts';
import type { UpdateAdvisoryState } from '../cli.update/u.advisory.ts';

type CliDeps = {
  readonly printRootHelp?: (args: t.Root.CliRootParsedArgs) => unknown;
  readonly prepareRootUpdateAdvisory?: () => Promise<UpdateAdvisoryState>;
  readonly refreshRootUpdateAdvisoryInBackground?: (state: UpdateAdvisoryState) => void;
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

  if (args.help) {
    if (args.command) {
      await dispatchRootCommand(cwd, args.command, argv, { origin: 'argv' });
      return;
    }

    const printRootHelp = deps.printRootHelp ?? (await import('./u.help.ts')).printRootHelp;
    printRootHelp(args);
    return;
  }

  const prepareRootUpdateAdvisory = deps.prepareRootUpdateAdvisory ??
    (await import('./u.updateAdvisory.ts')).prepareRootUpdateAdvisory;
  const refreshRootUpdateAdvisoryInBackground = deps.refreshRootUpdateAdvisoryInBackground ??
    (await import('./u.updateAdvisory.ts')).refreshRootUpdateAdvisoryInBackground;
  const info = deps.info ?? console.info;

  const advisory = await prepareRootUpdateAdvisory();
  refreshRootUpdateAdvisoryInBackground(advisory);

  if (advisory.prelude) info(advisory.prelude);

  if (args.command) {
    await dispatchRootCommand(cwd, args.command, argv, { origin: 'argv' });
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

function isBackResult(value: unknown): value is { readonly kind: 'back' } {
  return Is.record(value) && value.kind === 'back';
}
