import { type t, Cli, TmplEngine, Args, c, D, Fs, getConfig, Is, Prompt } from './common.ts';
import { normalize } from './u.config.doc.ts';
import { Fmt } from './u.fmt.ts';
import { promptAddServeLocation, promptRemoveDocument } from './u.prompt.ts';
import { startServing } from './u.serve.ts';

/**
 * Main entry:
 */
export const cli: t.ServeToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.toolname;
  const dir = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.ServeCliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname, dir));

  console.info(await Fmt.header(toolname));
  const res = await run(dir);
  console.info(Fmt.signoff(toolname));

  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */
async function run(dir: t.StringDir): Promise<t.RunReturn> {
  const config = await getConfig(dir);
  await normalize(config);
  const done = (exit: number | boolean = false): t.RunReturn => ({ exit });

  const listing = (config.current.locations ?? []).map((item, i, total) => {
    const branch = Fmt.Tree.branch([i, total]);
    let name = `${branch} ${'with:'} ${c.green(item.name)}`;
    return { name, value: item.dir };
  });

  console.info();
  const A = (await Prompt.Select.prompt<t.ServeCommand>({
    message: 'Choose:\n',
    options: [{ name: 'add: <serve location>', value: 'modify:add' }, ...listing],
  })) as t.ServeCommand;

  if (A === 'modify:add') {
    await promptAddServeLocation(dir);
    return done();
  }

  const location = (config.current.locations ?? []).find((m) => m.dir === A);
  if (!location) {
    console.info();
    console.info(c.yellow(`Could not find a server configuration`));
    console.info(c.gray(`directory: ${A}`));
    console.info();
    return done();
  }

  const B = (await Prompt.Select.prompt<t.ServeCommand>({
    message: `with: ${c.gray(location.name)}`,
    options: [
      { name: 'Start Serving (HTTP)', value: 'serve:start' },
      { name: '(Forget)', value: 'modify:remove' },
    ],
  })) as t.ServeCommand;

  if (B === 'modify:remove') {
    await promptRemoveDocument(dir, location);
  }

  if (B === 'serve:start') {
    await startServing(location);
  }

  return done();
}
