import { type t } from './common.ts';
import { parseRootArgs } from './u.args.ts';
import { dispatchRootCommand } from './u.dispatcher.ts';
import { printRootHelp } from './u.help.ts';

export async function cli(cwd: t.StringDir, argv: string[]) {
  const args = parseRootArgs(argv);
  if (args.command) {
    await dispatchRootCommand(args.command, argv);
  } else {
    printRootHelp(args);
  }
}
