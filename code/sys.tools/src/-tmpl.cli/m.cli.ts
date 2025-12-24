import { type t, done, Args, c, Cli, D, Fs, Is, TmplEngine, opt } from './common.ts';
import { Config } from './u.config.ts';
import { Fmt } from './u.fmt.ts';

/**
 * Main entry:
 */
export const cli: t.__NAME__ToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.__NAME__Tool.CliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname, cwd));

  /* Pre-reqs */
  await Config.ensureFile(cwd, D.Config.filename);

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
async function run(cwd: t.StringDir, args: t.ServeTool.CliArgs): Promise<t.RunReturn> {
  const config = await Config.get(cwd);
  await Config.normalize(config);

  /** --------------------------------------------------------
   * Root Menu
   */
  {
    console.info();
    const A = (await Cli.Input.Select.prompt<t.__NAME__Tool.Command>({
      message: 'Tools:\n',
      options: [
        opt(` Option A (clone \`-tmpl\` as new ${c.green('<tool>')})`, 'option-a'),
        opt(' Option B', 'option-b'),
      ],
      hideDefault: true,
    })) as t.__NAME__Tool.Command;

    //
    // 🐷 TODO: Replace here ↓
    //
    if (A === 'option-a') {
      const dirname = await Cli.Input.Text.prompt('Clone to directory (name):');
      const dirs = {
        target: Fs.join(cwd, dirname),
        source: Fs.dirname(Fs.Path.fromFileUrl(import.meta.url)),
      };

      const name = await Cli.Input.Text.prompt('__NAME__ → <MyName>');
      const tmpl = TmplEngine.makeTmpl(dirs.source, async (e) => {
        const replaced = (e.text ?? '').replaceAll('__NAME__', name);
        e.modify(replaced);
      });

      // Write to disk.
      await tmpl.write(dirs.target);
      return done();
    }

    if (A === 'exit') return done(0);
  }

  /** --------------------------------------------------------
   * Sub-Menu
   */
  {
    const B = (await Cli.Input.Select.prompt<t.__NAME__Tool.Command>({
      message: `With:`,
      options: [
        { name: ` Thing ${c.cyan('Ba')}`, value: 'option-ba' },
        { name: ` Thing ${c.cyan('Bb')}`, value: 'option-bb' },
        { name: c.gray('(quit)'), value: 'exit' },
      ],
    })) as t.__NAME__Tool.Command;

    if (B === 'option-ba') {
      console.log('🐷 B:', B);
      return done(0);
    }

    if (B === 'option-bb') {
      console.log('🐷 B:', B);
      return done(0);
    }

    if (B === 'exit') return done(0);
  }

  /** --------------------------------------------------------
   * End
   */
  return done();
}
