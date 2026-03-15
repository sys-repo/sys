import { type t } from './common.ts';
import { parseArgs } from './u.args.ts';

export async function cli(cwd: t.StringDir, argv: string[]) {
  const args = parseArgs(argv);
  if (args.command) {
    const { dispatchRootCommand } = await import('./u.dispatcher.ts');
    await dispatchRootCommand(args.command, argv);
  } else {
    if (args.help) {
      const { printRootHelp } = await import('./u.help.ts');
      printRootHelp(args);
      return;
    }

    const { rootMenu } = await import('./u.menu.ts');
    const picked = await rootMenu();
    if (picked.kind === 'exit') return;

    const { dispatchRootCommand } = await import('./u.dispatcher.ts');
    await dispatchRootCommand(picked.command, [picked.command]);
  }
}
