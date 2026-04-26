import { type t } from './common.ts';
import { parseArgs } from './u.args.ts';

export async function cli(cwd: t.StringDir, argv: string[]) {
  const args = parseArgs(argv);
  if (args.command) {
    const { dispatchRootCommand } = await import('./u.dispatcher.ts');
    await dispatchRootCommand(cwd, args.command, argv);
  } else {
    if (args.help) {
      const { printRootHelp } = await import('./u.help.ts');
      printRootHelp(args);
      return;
    }

    const { prepareRootUpdateAdvisory, refreshRootUpdateAdvisoryInBackground } = await import('./u.updateAdvisory.ts');
    const advisory = await prepareRootUpdateAdvisory();
    refreshRootUpdateAdvisoryInBackground(advisory);

    if (advisory.prelude) console.info(advisory.prelude);

    const { rootMenu } = await import('./u.menu.ts');
    const picked = await rootMenu({ highlightUpdate: advisory.hasUpdate });
    if (picked.kind === 'exit') return;

    const { dispatchRootCommand } = await import('./u.dispatcher.ts');
    await dispatchRootCommand(cwd, picked.command, [picked.command]);
  }
}
