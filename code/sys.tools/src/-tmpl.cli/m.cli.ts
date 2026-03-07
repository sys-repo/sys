import { type t, c, Cli, D, done, Fs, Is, opt } from './common.ts';
import { parseArgs } from './u.args.ts';
import { Fmt } from './u.fmt.ts';
import { promptTemplateVariant } from './u.menu.ts';
import { cloneTemplate } from './u.tmpl/mod.ts';
// [tmpl:variant.imports]

/**
 * Main entry:
 */
export const cli: t.__NAME__ToolsLib['cli'] = async (cwd, argv) => {
  const args = parseArgs(argv);
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');

  if (args.help) return void console.info(await Fmt.help(toolname, cwd));
  // [tmpl:variant.migrate]

  /* Run */
  console.info(await Fmt.header(toolname));
  const res = await run(cwd, args);
  console.info(Fmt.signoff(toolname));

  /* Exit */
  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */
async function run(cwd: t.StringDir, _args: t.__NAME__Tool.CliArgs): Promise<t.RunReturn> {
  /** --------------------------------------------------------
   * Root Menu (Loop)
   */
  while (true) {
    console.info();
    const A = (await Cli.Input.Select.prompt<t.__NAME__Tool.MenuCmd>({
      message: 'Tools:\n',
      options: [
        opt(` Option A (clone \`-tmpl\` as new ${c.green('tool')})`, 'option-a'),
        opt(' YAML Configs', 'config'),
        opt(c.gray('(quit)'), 'exit'),
      ],
      hideDefault: true,
    })) as t.__NAME__Tool.MenuCmd;

    /** --------------------------------------------------------
     * Sub-Menu: A
     */
    if (A === 'option-a') {
      const variant = await promptTemplateVariant();
      if (!variant) continue;
      await cloneTemplate(cwd, variant);
      return done(0);
    }

    /** --------------------------------------------------------
     * Sub-Menu: B
     */
    // [tmpl:variant.option-b:start]
    if (A === 'config') {
      console.info(c.gray('No config support in stateless template.'));
      continue;
    }
    // [tmpl:variant.option-b:end]

    if (A === 'exit') return done(0);
  }

  /** --------------------------------------------------------
   * End
   */
  return done(0);
}
