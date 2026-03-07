import { type t, c, Fmt, Str } from './common.ts';
import { rootRows } from './u.rows.ts';

export async function printRootHelp(args: t.Tools.CliRootParsedArgs) {
  const s = await Fmt.help(' system:tools', (e) => {
    rootRows().forEach((row) => e.row(...row.columns));
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
