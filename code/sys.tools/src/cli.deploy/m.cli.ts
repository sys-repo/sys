import { type t, Args, c, Cli, D, done, Fs, Is } from './common.ts';
import { Config } from './u.config.ts';
import { Fmt } from './u.fmt.ts';
import { endpointsMenu } from './u.menu.endpoints.ts';

/**
 * Main entry:
 */
export const cli: t.DeployToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.DeployTool.CliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname, cwd));

  /**
   * Check pre-reqs:
   */
  const configpath = Fs.join(cwd, D.Config.filename);
  if (!(await Fs.exists(configpath))) {
    console.info(Fmt.Prereqs.folderNotConfigured(cwd, toolname));
    const yes = await Cli.Input.Confirm.prompt({ message: `Create config file now?` });
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
async function run(cwd: t.StringDir, args: t.DeployTool.CliArgs): Promise<t.RunReturn> {
  const config = await Config.get(cwd);
  await Config.normalize(config);

  /** --------------------------------------------------------
   * Root Menu
   */
  {
    console.info();
    const picked = await endpointsMenu(config);
    if (picked.kind === 'exit') return done(0);

    // Minimal "next step" placeholder: we have an endpoint key.
    console.info(c.gray(`picked:`), c.cyan(picked.key));
    return done(0);
  }

  /** --------------------------------------------------------
   * End
   */
  return done();
}
