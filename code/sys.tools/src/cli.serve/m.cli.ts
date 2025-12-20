import { startServing } from './cmd.serve/mod.ts';

import { type t, Args, c, Cli, D, done, Fs, indexedMenu, Is, Time } from './common.ts';
import { Config } from './u.config.ts';
import { Fmt } from './u.fmt.ts';
import { serveLocationMenu } from './u.menu.location.ts';
import { promptAddServeLocation, promptRemoveDocument } from './u.prompt.ts';

type C = t.ServeTool.Command;

const Imports = {
  pull: () => import('./cmd.pull/mod.ts'),
} as const;

/**
 * Main entry
 */
export const cli: t.ServeToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');

  const args = Args.parse<t.ServeTool.CliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) {
    console.info(await Fmt.help(toolname, cwd));
    return;
  }

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
 * Execution
 */
async function run(cwd: t.StringDir, args: t.ServeTool.CliArgs): Promise<t.RunReturn> {
  const port = Is.num(args.port) ? args.port : D.port;
  const config = await Config.get(cwd);

  while (true) {
    const picked = await indexedMenu({
      scope: 'serve',
      config,
      adapter: {
        list: (doc) => doc.dirs ?? [],
        set: (doc, _scope, next) => (doc.dirs = [...next]),
        keyOf: (e) => e.dir,
        lastUsedAtOf: (e) => e.lastUsedAt,
        withLastUsedAt: (e, ts) => ({ ...e, lastUsedAt: ts }),
        labelOf(e) {
          const shown = e.dir.startsWith('/') ? e.dir : e.dir === '.' ? './' : `./${e.dir}`;
          return `${e.name}  ${c.gray(shown)}`;
        },
        async add() {
          await promptAddServeLocation(cwd);
        },
      },

      ui: {
        message: 'Tools:\n',
        prefix: 'serve:',
        addLabel: '   add: <dir>',
      },
    });

    if (picked.kind === 'exit') return done();

    const location = Config.findLocation(config.current, picked.key);
    if (!location) {
      console.info(c.yellow(`Could not find a server configuration`));
      console.info(c.gray(`directory: ${picked.key}`));
      continue;
    }

    const locationKey = location.dir;
    const locationAbsDir = Config.resolveDir(cwd, location.dir);
    const runtimeLocation: t.ServeTool.Config.Dir = { ...location, dir: locationAbsDir };

    if (Fs.cwd() !== locationAbsDir) {
      console.info(c.gray(`directory: ${locationAbsDir}`));
    }

    const res = await serveLocationMenu({
      location: runtimeLocation,
      port,
    });

    if (res.kind === 'back') continue;

    if (res.kind === 'remove') {
      await promptRemoveDocument(cwd, location);
      return done(0);
    }

    if (res.kind === 'start') {
      await startServing(cwd, runtimeLocation, { port, host: res.host });
      return done(0);
    }

    if (res.kind === 'bundles') {
      const m = await Imports.pull();
      const { bundle } = await m.pullBundle(cwd, runtimeLocation);
      if (bundle?.local) {
        config.change((d) => {
          const hit = Config.findBundle(d, locationKey, bundle.local.dir);
          if (hit) hit.lastUsedAt = Time.now.timestamp;
        });
        await config.fs.save();
      }

      return done(0);
    }

    return done(0);
  }
}
