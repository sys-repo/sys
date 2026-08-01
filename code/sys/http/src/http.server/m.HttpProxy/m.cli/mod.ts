import { c, Err, type t } from '../common.ts';
import { HttpProxy } from '../m.HttpProxy.ts';
import { parseArgs, type ProxyCliParsedArgs } from './u.args.ts';
import { Fmt } from './u.fmt.ts';

/** CLI entrypoint for the reverse-proxy owner CLI. */
export async function cli(cwd: t.StringDir, argv: string[] = []): Promise<number> {
  let args: ProxyCliParsedArgs;
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

  if (args.command === 'root:set') {
    if (args.help) {
      console.info(Fmt.rootSetHelp(cwd));
      return 0;
    }
    return await runRootSet(cwd, args);
  }

  if (args.command === 'root') {
    console.info(Fmt.rootHelp(cwd));
    if (args.help || args._.length === 1) return 0;
    console.info(c.yellow(`Unknown root command: ${args._.slice(1).join(' ')}`));
    return 1;
  }

  if (args.command === 'mount:add') {
    if (args.help) {
      console.info(Fmt.mountAddHelp(cwd));
      return 0;
    }
    return await runMountAdd(cwd, args);
  }

  if (args.command === 'mount') {
    console.info(Fmt.mountHelp(cwd));
    if (args.help || args._.length === 1) return 0;
    console.info(c.yellow(`Unknown mount command: ${args._.slice(1).join(' ')}`));
    return 1;
  }

  if (args.help || args._.length === 0) {
    console.info(Fmt.help(cwd));
    return 0;
  }

  console.info(Fmt.error(`Unknown command: ${args._.join(' ')}`));
  return 1;
}

async function runConfigAdd(cwd: t.StringDir, args: ProxyCliParsedArgs): Promise<number> {
  try {
    if (args._.length > 2) throw new Error(`Unexpected argument: ${args._[2]}`);
    assertConfigAddOptions(args);

    const result = await HttpProxy.Config.add({
      cwd,
      config: args.config,
      name: args.name,
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

async function runRootSet(cwd: t.StringDir, args: ProxyCliParsedArgs): Promise<number> {
  try {
    if (args._.length > 2) throw new Error(`Unexpected argument: ${args._[2]}`);
    assertRootSetOptions(args);

    const result = await HttpProxy.Root.set({
      cwd,
      config: args.config,
      upstream: args.upstream,
      name: args.name,
      hostname: args.hostname,
      port: args.port,
      dryRun: args['dry-run'] === true,
    });

    console.info(Fmt.rootSetResult(result));
    return 0;
  } catch (error) {
    console.info(Fmt.error(Err.summary(error)));
    return 1;
  }
}

async function runMountAdd(cwd: t.StringDir, args: ProxyCliParsedArgs): Promise<number> {
  try {
    if (args._.length > 2) throw new Error(`Unexpected argument: ${args._[2]}`);
    assertMountAddOptions(args);

    const result = await HttpProxy.Mount.add({
      cwd,
      config: args.config,
      mount: args.mount,
      upstream: args.upstream,
      name: args.name,
      hostname: args.hostname,
      port: args.port,
      dryRun: args['dry-run'] === true,
    });

    console.info(Fmt.mountAddResult(result));
    return 0;
  } catch (error) {
    console.info(Fmt.error(Err.summary(error)));
    return 1;
  }
}

function assertConfigAddOptions(args: ProxyCliParsedArgs): void {
  if (args.mount !== undefined) {
    throw new Error('Unexpected option for config add: --mount. Use mount add to write mounts.');
  }
  if (args.upstream !== undefined) {
    throw new Error(
      'Unexpected option for config add: --upstream. Use root set or mount add to write upstreams.',
    );
  }
}

function assertRootSetOptions(args: ProxyCliParsedArgs): void {
  if (args.mount !== undefined) {
    throw new Error('Unexpected option for root set: --mount. Use mount add to write mounts.');
  }
}

function assertMountAddOptions(_args: ProxyCliParsedArgs): void {
  return;
}
