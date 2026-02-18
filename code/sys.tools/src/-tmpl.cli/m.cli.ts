import { type t, c, Cli, D, done, Fs, Is, opt, TmplEngine } from './common.ts';
import { parseArgs } from './u.args.ts';
import { Fmt } from './u.fmt.ts';
import { promptTemplateVariant } from './u.menu.ts';
import { cloneTemplate } from './u.tmpl.clone.ts';

/**
 * Main entry:
 */
export const cli: t.__NAME__ToolsLib['cli'] = async (cwd, argv) => {
  const args = parseArgs(argv);
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');

  if (args.help) return void console.info(await Fmt.help(toolname, cwd));

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
        opt(' Option B', 'option-b'),
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
    if (A === 'option-b') {
      type WithCommand = Extract<t.__NAME__Tool.MenuCmd, 'option-ba' | 'option-bb'>;
      let lastSelection: WithCommand | undefined;

      while (true) {
        console.info();
        const B = (await Cli.Input.Select.prompt<t.__NAME__Tool.MenuCmd>({
          message: `With:`,
          options: [
            { name: `  Thing ${c.cyan('Ba')}`, value: 'option-ba' },
            { name: `  Thing ${c.cyan('Bb')}`, value: 'option-bb' },
            { name: `${c.cyan('←')} back`, value: 'back' },
          ],
          default: lastSelection,
          hideDefault: true,
        })) as t.__NAME__Tool.MenuCmd;

        if (B === 'option-ba') {
          lastSelection = B;
        }

        if (B === 'option-bb') {
          lastSelection = B;
        }

        if (B === 'back') break;
      }

      continue;
    }

    if (A === 'exit') return done(0);
  }

  /** --------------------------------------------------------
   * End
   */
  return done(0);
}
