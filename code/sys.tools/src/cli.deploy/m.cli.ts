import { type t, D, done, Fs, Is } from './common.ts';
import { runEndpointAction } from './u.endpointAction.ts';
import { parseArgs } from './u.args.ts';
import { Fmt } from './u.fmt.ts';
import { EndpointsMigrate } from './u.endpoints/mod.ts';
import { endpointMenu, endpointsMenu } from './u.menu/mod.ts';
import { resolveNonInteractive } from './u.resolve.nonInteractive.ts';

/**
 * Main entry:
 */
export const cli: t.DeployToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = parseArgs(argv);
  if (args.help) return void console.info(await Fmt.help(cwd));

  /* Run */
  console.info(await Fmt.header(toolname));
  const res = args.interactive ? await runInteractive(cwd) : await runNonInteractive(cwd, args);
  console.info(Fmt.signoff(toolname));

  /* Exit */
  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */
async function runInteractive(cwd: t.StringDir): Promise<t.RunReturn> {
  await EndpointsMigrate.run(cwd);

  while (true) {
    console.info();
    const picked = await endpointsMenu(cwd);
    if (picked.kind === 'exit') return done(0);

    const res = await endpointMenu({ cwd, key: picked.key });
    if (res.kind === 'back') continue;
  }
}

async function runNonInteractive(
  cwd: t.StringDir,
  args: t.DeployTool.CliParsedArgs,
): Promise<t.RunReturn> {
  await EndpointsMigrate.run(cwd);

  const resolved = await resolveNonInteractive(cwd, args);
  const result = await runEndpointAction({
    cwd,
    key: resolved.key,
    yamlPath: resolved.yamlPath,
    action: resolved.action,
  });

  return done(result.ok ? 0 : 1);
}
