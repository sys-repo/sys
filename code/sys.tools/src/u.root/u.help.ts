import { type t, c, Fmt, pkg, Str } from './common.ts';
import { ALIAS } from './u.args.ts';

export async function printRootHelp(args: t.Tools.CliRootParsedArgs) {
  const s = await Fmt.help(' system:tools', (e, c) => {
    const fmt = (tool: t.Tools.Command) => c.gray(c.dim(`${pkg.name}/`)) + tool;
    const add = (tool: t.Tools.Command, alias?: readonly string[]) => {
      const items = [fmt(tool)];
      if (alias) items.push(c.gray(`(← alias ${c.white(alias.join(' '))})`));
      e.row(...items);
    };
    add('copy', ALIAS.copy);
    add('crdt');
    add('serve');
    add('deploy');
    add('video');
    add('update', ALIAS.update);
  });

  console.info(s);

  if (args.help) {
    const cmd = 'deno run -A jsr:@sys/tools';
    const alias = `${c.italic(c.cyan('alias'))} ${c.white('sys')}=${c.yellow(`"${cmd}"`)}`;
    const str = Str.builder()
      //
      .line(`  shortcut: ${alias}`)
      .blank();
    console.info(c.gray(String(str)));
  }
}
