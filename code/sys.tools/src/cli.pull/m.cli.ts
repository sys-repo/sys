import { c, D, done, Err, Fs, Is, type t } from './common.ts';
import { runAdd } from './u.add.run.ts';
import { parseArgs } from './u.args.ts';
import { pullBundle } from './u.bundle/mod.ts';
import { Fmt } from './u.fmt.ts';
import { yamlConfigsMenu } from './u.menu.yaml.ts';
import { resolveNonInteractive } from './u.resolve.nonInteractive.ts';
import { run } from './u.run.ts';
import { PullFs } from './u.yaml/mod.ts';

/** Run Pull with interactive menus or explicit non-interactive arguments. */
export const cli: t.PullToolsLib['cli'] = async (cwd, argv): Promise<void> => {
  const args = parseArgs(argv);
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');

  if (args.command === 'add') {
    if (args.help) return void console.info(await Fmt.addHelp(cwd));
    console.info(await Fmt.header(toolname, undefined, { exitHint: false }));
    const res = await runAdd(cwd, args);
    console.info(Fmt.signoff(toolname));
    const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
    if (exit > -1) Deno.exit(exit);
    return;
  }

  if (args._.length > 0) {
    console.info(await Fmt.help(cwd));
    console.info(c.yellow(`Unknown command: ${args._[0]}`));
    Deno.exit(1);
  }

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
  while (true) {
    const picked = await yamlConfigsMenu(cwd);
    if (picked.kind === 'exit') return done();

    const yamlPath = Fs.join(cwd, PullFs.fileOf(picked.key));
    const loaded = await PullFs.loadLocation(yamlPath);

    if (!loaded.ok) {
      console.info(c.yellow('Could not load pull configuration'));
      console.info(c.gray(`config: ${picked.key}`));
      continue;
    }

    const location = loaded.location;
    if (Fs.cwd() !== location.dir) {
      console.info(c.gray(`directory: ${location.dir}`));
    }

    while (true) {
      const result = await pullBundle(cwd, yamlPath, location);
      if (result.kind === 'back') break;
    }
  }
}

async function runNonInteractive(
  cwd: t.StringDir,
  args: t.PullTool.CliParsedArgs,
): Promise<t.RunReturn> {
  const resolved = await resolveNonInteractive(cwd, args);

  try {
    const result = await run({ cwd, config: resolved.config });
    if (result.bundles.length === 0) {
      console.info(c.gray('No bundles configured.'));
      return done(0);
    }

    for (const bundle of result.bundles) {
      console.info(Fmt.pullSummary({ bundle: bundle.bundle, data: bundle.data }));
    }

    return done(0);
  } catch (error) {
    console.info(Fmt.pullError(Err.summary(error, { cause: true, stack: false })));
    return done(1);
  }
}
