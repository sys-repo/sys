import { startServing } from './m.server/mod.ts';

import { type t, c, D, done, Fs, Is, Open } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { parseArgs } from './u.args.ts';
import { serveLocationMenu } from './u.menu.location.ts';
import { serveLocationsMenu } from './u.menu.locations.ts';
import { resolveNonInteractive } from './u.resolve.nonInteractive.ts';
import { ServeFs, ServeMigrate } from './u.yaml/mod.ts';

/**
 * Main entry:
 */
export const cli: t.ServeToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = parseArgs(argv);
  if (args.help) return void console.info(await Fmt.help(cwd));

  /* Migrate legacy configs (idempotent). */
  await ServeMigrate.run(cwd);

  /* Run */
  const res = args.interactive ? await runInteractiveWithShell(cwd, args, toolname) : await runNonInteractive(cwd, args);

  /* Exit */
  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution
 */
async function runInteractiveWithShell(
  cwd: t.StringDir,
  args: t.ServeTool.CliParsedArgs,
  toolname: string,
): Promise<t.RunReturn> {
  console.info(await Fmt.header(toolname));
  const res = await runInteractive(cwd, args);
  console.info(Fmt.signoff(toolname));
  return res;
}

async function runInteractive(cwd: t.StringDir, args: t.ServeTool.CliParsedArgs): Promise<t.RunReturn> {
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
      const res = await serveLocationMenu({ location, port });
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
    }
  }
}

async function runNonInteractive(cwd: t.StringDir, args: t.ServeTool.CliParsedArgs): Promise<t.RunReturn> {
  const resolved = await resolveNonInteractive(cwd, args);
  const { startServer } = await import('./m.server/mod.ts');
  const context = startServer(resolved.location, {
    port: Is.num(args.port) ? args.port : D.port,
    host: resolved.host,
    keyboard: true,
  });

  const url = `${context.baseUrl}/` as t.StringUrl;
  if (resolved.open) Open.invokeDetached(cwd, url, { silent: true });

  await context.server.finished;
  return done(0);
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
