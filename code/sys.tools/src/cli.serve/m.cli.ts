import { type t, Args, c, Cli, D, done, Fs, Is, opt, Prompt, Time } from './common.ts';

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
  const res = await run(cwd, args);
  console.info(Fmt.signoff(toolname));

  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */
async function run(cwd: t.StringDir, args: t.ServeTool.CliArgs): Promise<t.RunReturn> {
  const port = Is.num(args.port) ? args.port : D.port;
  const config = await Config.get(cwd);
  await normalize(config);

  const Update = {
    async locationLastUsedAt(locationDir: t.StringDir) {
      config.change((d) => {
        const dir = Config.findLocation(d, locationDir);
        if (dir) dir.lastUsedAt = Time.now.timestamp;
      });
      await config.fs.save();
    },
    async bundleLastUsed(locationDir: t.StringDir, localDir?: t.StringRelativeDir) {
      config.change((d) => {
        const bundle = Config.findBundle(d, locationDir, localDir);
        if (bundle) bundle.lastUsedAt = Time.now.timestamp;
      });
      await config.fs.save();
    },
  } as const;

  const listing = Config.orderByRecency(config.current.dirs).map((item, i, total) => {
    const branch = Fmt.Tree.branch([i, total]);
    let name = ` ${'serve:'} ${branch} ${c.green(item.name)}`;
    return { name, value: item.dir };
  });

  const defaultCommand = listing.length > 0 ? listing[0].value : ('modify:add' satisfies C);
  const A = (await Prompt.Select.prompt<C>({
    message: 'Tools:\n',
    options: [
      //
      opt('   add: <local>', 'modify:add'),
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
    const location = Config.findLocation(config.current, A)!;
    if (!location) {
      console.info();
      console.info(c.yellow(`Could not find a server configuration`));
      console.info(c.gray(`directory: ${A}`));
      console.info();
      return done();
    }
    await Update.locationLastUsedAt(location.dir);

    if (Fs.cwd() !== location.dir) {
      console.info(c.gray(`directory: ${location.dir}`));
    }

    const fmtLocalhost = c.gray(`(${c.cyan(`port:${port}`)})`);
    const B = (await Prompt.Select.prompt<C>({
      message: `With: ${c.gray(location.name)}`,
      options: [
        opt(` start server ${fmtLocalhost}`, 'serve:start'),
        opt(' manage bundles', 'bundle'),
      ],
    })) as C;

    if (B === 'modify:remove') {
      await promptRemoveDocument(cwd, location);
      return done(0);
    }

    if (B === 'serve:start') {
      await startServing(cwd, location, { port });
      return done(0);
    }

    if (B === 'bundle') {
      const m = (await import('./cmd.pull/mod.ts')) satisfies typeof import('./cmd.pull/mod.ts');
      const { bundle } = await m.pullBundle(cwd, location);
      if (bundle?.local) await Update.bundleLastUsed(location.dir, bundle.local.dir);
      return done(0);
    }
  }

  return done(0);
}
