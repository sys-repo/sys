import { type t, Args, c, Cli, D, done, Fs, Is, Prompt } from './common.ts';

import { startServing } from './cmd.serve/mod.ts';
import { Config, normalize } from './u.config.ts';
import { Fmt } from './u.fmt.ts';
import { promptAddServeLocation, promptRemoveDocument } from './u.prompt.ts';

type C = t.ServeTool.Command;

/**
 * Main entry:
 */
export const cli: t.ServeToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.toolname;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.ServeTool.CliArgs>(argv, { alias: { h: 'help' } });
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
  const config = await Config.get(cwd);
  await normalize(config);

  const opt = (name: string, value: C) => ({ name, value });

  const listing = (config.current.dirs ?? []).map((item, i, total) => {
    const branch = Fmt.Tree.branch([i, total]);
    let name = ` ${'serve:'} ${branch} ${c.green(item.name)}`;
    return { name, value: item.dir };
  });

  const defaultCommand = listing.length > 0 ? listing[0].value : ('modify:add' satisfies C);
  const A = (await Prompt.Select.prompt<C>({
    message: 'Tools:\n',
    options: [
      //
      opt('   add: <local-dir>', 'modify:add'),
      ...listing,
      opt(c.gray('(exit)'), 'exit'),
    ],
    default: defaultCommand as C,
    hideDefault: true,
  })) as C;

  if (A === 'exit') return done();

  if (A === 'modify:add') {
    await promptAddServeLocation(cwd);
    return done();
  }

  /** --------------------------------------------------------
   * Serve location (folder):
   */
  {
    const location = Config.findLocation(config, A);
    if (!location) {
      console.info();
      console.info(c.yellow(`Could not find a server configuration`));
      console.info(c.gray(`directory: ${A}`));
      console.info();
      return done();
    }

    if (Fs.cwd() !== location.dir) {
      console.info(c.gray(`directory: ${location.dir}`));
    }

    const B = (await Prompt.Select.prompt<C>({
      message: `With: ${c.gray(location.name)}`,
      options: [
        opt(' start http server', 'serve:start'),
        opt(' dist/pkg bundles', 'bundle'),
        opt(c.dim(c.gray('(forget)')), 'modify:remove'),
      ],
    })) as C;

    if (B === 'modify:remove') {
      await promptRemoveDocument(cwd, location);
      return done(0);
    }

    if (B === 'serve:start') {
      await startServing(cwd, location);
      return done(0);
    }

    if (B === 'bundle') {
      const m = (await import('./cmd.pull/mod.ts')) satisfies typeof import('./cmd.pull/mod.ts');
      await m.pullBundle(cwd, location);
      console.info();
      return done(0);
    }
  }

  return done(0);
}
