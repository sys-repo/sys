import { type t, done, Args, c, Cli, D, Fs, Is, Prompt, TmplEngine } from './common.ts';
import { getConfig, normalize } from './u.config.ts';
import { Fmt } from './u.fmt.ts';

/**
 * Main entry:
 */
export const cli: t.__NAME__ToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.toolname;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.__NAME__Tool.CliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname, cwd));

  /**
   * Check pre-reqs:
   */
  const configpath = Fs.join(cwd, D.Config.filename);
  if (!(await Fs.exists(configpath))) {
    console.info(Fmt.Prereqs.folderNotConfigured(cwd, D.toolname));
    const yes = await Cli.Prompt.Confirm.prompt({ message: `Create config file now?` });
    if (!yes) Deno.exit(0);
  }

  console.info(await Fmt.header(toolname));
  const res = await run(cwd);
  console.info(Fmt.signoff(toolname));

  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */
async function run(cwd: t.StringDir): Promise<t.RunReturn> {
  const config = await getConfig(cwd);
  await normalize(config);

  /** --------------------------------------------------------
   * Root Menu
   */
  {
    console.info();
    const A = (await Prompt.Select.prompt<t.__NAME__Tool.Command>({
      message: 'Option:\n',
      options: [
        { name: ` Option A (clone \`-tmpl\` as new ${c.green('<tool>')})`, value: 'option-a' },
        { name: ' Option B', value: 'option-b' },
      ],
    })) as t.__NAME__Tool.Command;

    //
    // 🐷 TODO: Replace here ↓
    //
    if (A === 'option-a') {
      const dirname = await Cli.Prompt.Input.prompt('Clone to directory (name):');
      const dirs = {
        target: Fs.join(cwd, dirname),
        source: Fs.dirname(Fs.Path.fromFileUrl(import.meta.url)),
      };

      const name = await Cli.Prompt.Input.prompt('__NAME__ → <MyName>');
      const tmpl = TmplEngine.makeTmpl(dirs.source, async (e) => {
        const replaced = (e.text ?? '').replaceAll('__NAME__', name);
        e.modify(replaced);
      });

      // Write to disk.
      await tmpl.write(dirs.target);
      return done();
    }

    if (A === 'quit') return done(0);
  }

  /** --------------------------------------------------------
   * Sub-Menu
   */
  {
    const B = (await Prompt.Select.prompt<t.__NAME__Tool.Command>({
      message: `With:`,
      options: [
        { name: ` Thing ${c.cyan('Ba')}`, value: 'option-ba' },
        { name: ` Thing ${c.cyan('Bb')}`, value: 'option-bb' },
        { name: c.gray('(quit)'), value: 'quit' },
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

    if (B === 'quit') return done(0);
  }

  /** --------------------------------------------------------
   * End
   */
  return done();
}
