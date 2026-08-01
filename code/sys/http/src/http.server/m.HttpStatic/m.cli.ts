import { c, Err, type t } from './common.ts';
import { HttpStatic } from './m.HttpStatic.ts';
import { parseArgs, type StaticCliParsedArgs } from './u.args.ts';
import { Fmt } from './u.fmt.ts';

/** CLI entrypoint for the static server owner CLI. */
export async function cli(cwd: t.StringDir, argv: string[] = []): Promise<number> {
  let args: StaticCliParsedArgs;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.info(Fmt.error(Err.summary(error)));
    return 1;
  }

  if (args.command === 'config:add') {
    if (args.help) {
      console.info(Fmt.configAddHelp(cwd));
      return 0;
    }
    return await runConfigAdd(cwd, args);
  }

  if (args.command === 'config') {
    console.info(Fmt.configHelp(cwd));
    if (args.help || args._.length === 1) return 0;
    console.info(c.yellow(`Unknown config command: ${args._.slice(1).join(' ')}`));
    return 1;
  }

  if (args.help) {
    console.info(Fmt.help(cwd));
    return 0;
  }

  return await runStart(cwd, args);
}

async function runStart(cwd: t.StringDir, args: StaticCliParsedArgs): Promise<number> {
  try {
    if (args._.length > 0) throw new Error(`Unknown command: ${args._.join(' ')}`);
    assertStartOptions(args);

    const started = await HttpStatic.start({
      cwd,
      dir: args.dir,
      hostname: args.hostname,
      port: parsePort(args.port),
      name: args.name,
      silent: args.silent === true,
      keyboard: args.silent === true ? false : true,
    });
    await started.finished;
    return 0;
  } catch (error) {
    console.info(Fmt.error(Err.summary(error)));
    return 1;
  }
}

async function runConfigAdd(cwd: t.StringDir, args: StaticCliParsedArgs): Promise<number> {
  try {
    if (args._.length > 2) throw new Error(`Unexpected argument: ${args._[2]}`);
    assertConfigAddOptions(args);

    const result = await HttpStatic.Config.add({
      cwd,
      config: args.config,
      name: args.name,
      dir: args.dir,
      hostname: args.hostname,
      port: args.port,
      dryRun: args['dry-run'] === true,
    });

    console.info(Fmt.configAddResult(result));
    return 0;
  } catch (error) {
    console.info(Fmt.error(Err.summary(error)));
    return 1;
  }
}

function assertStartOptions(args: StaticCliParsedArgs): void {
  if (args.config !== undefined) {
    throw new Error(
      'Unexpected option for static server start: --config. Use config add to write config.',
    );
  }
  if (args['dry-run'] === true) {
    throw new Error('Unexpected option for static server start: --dry-run.');
  }
}

function assertConfigAddOptions(args: StaticCliParsedArgs): void {
  if (args.silent === true) {
    throw new Error('Unexpected option for config add: --silent.');
  }
}

function parsePort(input: string | undefined): number | undefined {
  if (input === undefined) return undefined;
  const port = Number(input);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('--port must be an integer between 0 and 65535.');
  }
  return port;
}
