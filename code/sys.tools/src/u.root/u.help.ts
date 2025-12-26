import { type t, c, Fmt, pkg, Str } from './common.ts';
import { parseRootArgs } from './u.args.ts';
import { dispatchRootCommand } from './u.dispatcher.ts';
import { ShellCommand } from './u.ShellCommand.ts';

export async function printRootHelp(argv: string[]) {
  const args = parseRootArgs(argv);

  const s = await Fmt.help(' system:tools', (e, c) => {
    const fmt = (tool: t.Tools.Command) => c.gray(c.dim(`${pkg.name}/`)) + tool;
    const add = (tool: t.Tools.Command, alias?: string) => {
      const items = [fmt(tool)];
      if (alias) items.push(c.gray(`(← alias ${c.white(alias)})`));
      e.row(...items);
    };
    add('copy', 'cp');
    add('crdt');
    add('serve');
    add('deploy');
    add('fs');
    add('video');
    add('update', 'up');
  });

  console.info(s);

  if (args.help) {
    const sys = c.bold(c.white('sys'));
    const cmd = c.green('deno run jsr:@sys/tools');
    const str = Str.builder()
      .line(`  Installs ${sys} as a lightweight shell alias over the raw`)
      .line(`  ${cmd} command. For convenience, you may`)
      .line(`  want to add it to your ${c.cyan('~/.zshrc')} or an equivalent file`);
    console.info(c.gray(String(str)));
    console.info(c.yellow(ShellCommand));
  }

  // Invoke sub-command if present
  if (args.command) {
    await dispatchRootCommand(args.command, argv);
  }
}
