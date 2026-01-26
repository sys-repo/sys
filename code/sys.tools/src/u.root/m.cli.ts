import { type t } from './common.ts';
import { parseArgs } from './u.args.ts';
import { dispatchRootCommand } from './u.dispatcher.ts';
import { printRootHelp } from './u.help.ts';
import { rootMenu } from './u.menu.ts';

export async function cli(cwd: t.StringDir, argv: string[]) {
  const args = parseArgs(argv);
  if (args.command) {
    await dispatchRootCommand(args.command, argv);
  } else {
    if (args.help) {
      printRootHelp(args);
      return;
    }

    const picked = await rootMenu();
    if (picked.kind === 'exit') return;
    await dispatchRootCommand(picked.command, [picked.command]);
  }
}
