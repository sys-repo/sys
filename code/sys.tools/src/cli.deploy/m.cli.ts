import { type t, Args, c, Cli, D, done, Fs, Is } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { EndpointsMigrate } from './u.endpoints/mod.ts';
import { endpointMenu, endpointsMenu } from './u.menu/mod.ts';

/**
 * Main entry:
 */
export const cli: t.DeployToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.DeployTool.CliArgs>(argv, { alias: { h: 'help' } });
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
async function run(cwd: t.StringDir, _args: t.DeployTool.CliArgs): Promise<t.RunReturn> {
  await EndpointsMigrate.run(cwd);

  /** --------------------------------------------------------
   * Root Menu
   */
  while (true) {
    console.info();
    const picked = await endpointsMenu(cwd);
    if (picked.kind === 'exit') return done(0);

    const res = await endpointMenu({ cwd, key: picked.key });
    if (res.kind === 'back') continue;
  }
}
