import { type t, Args, c, Cli, D, Fs, getConfig, Is, Prompt } from './common.ts';
import { normalize } from './u.config.ts';
import { Fmt } from './u.fmt.ts';
import { promptAddServeLocation, promptRemoveDocument } from './u.prompt.ts';
import { startServing } from './cmd.serve/mod.ts';

/**
 * Main entry:
 */
export const cli: t.ServeToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.toolname;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.ServeCliArgs>(argv, { alias: { h: 'help' } });
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
  const done = (exit: number | boolean = false): t.RunReturn => ({ exit });

  const listing = (config.current.dirs ?? []).map((item, i, total) => {
    const branch = Fmt.Tree.branch([i, total]);
    let name = ` ${branch} ${'serve:'} ${c.green(item.name)}`;
    return { name, value: item.dir };
  });

  console.info();
  const A = (await Prompt.Select.prompt<t.ServeCommand>({
    message: 'Action:',
    options: [{ name: '(+) serve from new <directory>', value: 'modify:add' }, ...listing],
  })) as t.ServeCommand;

  if (A === 'modify:add') {
    await promptAddServeLocation(cwd);
    return done();
  }

  const location = (config.current.dirs ?? []).find((m) => m.dir === A);
  if (!location) {
    console.info();
    console.info(c.yellow(`Could not find a server configuration`));
    console.info(c.gray(`directory: ${A}`));
    console.info();
    return done();
  }

  const B = (await Prompt.Select.prompt<t.ServeCommand>({
    message: `With: ${c.gray(location.name)}`,
    options: [
      { name: ' Start HTTP server', value: 'serve:start' },
      { name: '(forget)', value: 'modify:remove' },
    ],
  })) as t.ServeCommand;

  if (B === 'modify:remove') {
    await promptRemoveDocument(cwd, location);
  }

  if (B === 'serve:start') {
    await startServing(location);
  }

  return done();
}
