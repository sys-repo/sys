import { type t, done, Args, c, Cli, D, Fs, Is, Prompt, TmplEngine, opt } from './common.ts';
import { Config } from './u.config.ts';
import { Fmt } from './u.fmt.ts';

/**
 * Main entry:
 */
export const cli: t.DeployToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.toolname;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.DeployTool.CliArgs>(argv, { alias: { h: 'help' } });
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
  const res = await run(cwd, args);
  console.info(Fmt.signoff(toolname));

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
    const A = (await Prompt.Select.prompt<t.DeployTool.Command>({
      message: 'Tools:\n',
      options: [
        //
        opt(` Option A 🐷 - WIP`, 'option-a'),
        opt(' Option B 🐷 - WIP', 'option-b'),
      ],
      hideDefault: true,
    })) as t.DeployTool.Command;

    //
    // 🐷 TODO: Replace here ↓
    //
    console.info(A);
    if (A === 'option-a') {
      return done(0);
    }

    if (A === 'quit') return done(0);
  }

  /** --------------------------------------------------------
   * Sub-Menu
   */
  {
    const B = (await Prompt.Select.prompt<t.DeployTool.Command>({
      message: `With:`,
      options: [
        { name: ` Thing ${c.cyan('Ba')}`, value: 'option-ba' },
        { name: ` Thing ${c.cyan('Bb')}`, value: 'option-bb' },
        { name: c.gray('(quit)'), value: 'quit' },
      ],
    })) as t.DeployTool.Command;

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
