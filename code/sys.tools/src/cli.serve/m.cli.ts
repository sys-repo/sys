import { startServing } from './cmd.serve/mod.ts';

import { type t, Args, c, D, done, Fs, Is } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { serveLocationMenu } from './u.menu.location.ts';
import { serveLocationsMenu } from './u.menu.locations.ts';
import { ServeFs, ServeMigrate } from './u.yaml/mod.ts';

const Imports = {
  pull: () => import('./cmd.pull/mod.ts'),
} as const;

/**
 * Main entry:
 */
export const cli: t.ServeToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.ServeTool.CliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname, cwd));

  /* Migrate legacy configs (idempotent). */
  await ServeMigrate.run(cwd);

  /* Run */
  console.info(await Fmt.header(toolname));
  const res = await run(cwd, args);
  console.info(Fmt.signoff(toolname));

  /* Exit */
  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution
 */
async function run(cwd: t.StringDir, args: t.ServeTool.CliArgs): Promise<t.RunReturn> {
  const port = Is.num(args.port) ? args.port : D.port;

  while (true) {
    const picked = await serveLocationsMenu(cwd);
    if (picked.kind === 'exit') return done();

    const yamlPath = Fs.join(cwd, ServeFs.fileOf(picked.key));
    const loaded = await ServeFs.loadLocation(yamlPath);

    if (!loaded.ok) {
      console.info(c.yellow(`Could not load server configuration`));
      console.info(c.gray(`location: ${picked.key}`));
      continue;
    }

    const location = loaded.location;
    if (Fs.cwd() !== location.dir) {
      console.info(c.gray(`directory: ${location.dir}`));
    }

    while (true) {
      const res = await serveLocationMenu({ location, port, yamlPath });
      if (res.kind === 'back') break;
      if (res.kind === 'remove') {
        await promptRemoveLocation(yamlPath);
        return done(0);
      }
      if (res.kind === 'start') {
        const result = await startServing(cwd, location, { port, host: res.host });
        if (result.kind === 'back') continue;
        return done(0);
      }
      if (res.kind === 'bundles') {
        const m = await Imports.pull();
        const result = await m.pullBundle(cwd, yamlPath, location);
        if (result.kind === 'back') continue;
        return done(0);
      }
    }
  }
}

/**
 * Prompt to remove a serve location (deletes the YAML file).
 */
async function promptRemoveLocation(yamlPath: t.StringPath) {
  const { Cli } = await import('./common.ts');
  const ok = await Cli.Input.Confirm.prompt({
    message: 'Remove this serve location?',
    hint: 'Are you sure? (deletes the YAML file)',
  });
  if (!ok) return;
  await Fs.remove(yamlPath);
}
