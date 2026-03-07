import { type t, c, D, done, Fs, Is } from './common.ts';
import { pullBundle } from './u.bundle/mod.ts';
import { parseArgs } from './u.args.ts';
import { Fmt } from './u.fmt.ts';
import { yamlConfigsMenu } from './u.menu.yaml.ts';
import { PullFs, PullMigrate } from './u.yaml/mod.ts';

/**
 * Main entry:
 */
export const cli: t.PullToolsLib['cli'] = async (cwd, argv) => {
  const args = parseArgs(argv);
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');

  if (args.help) return void console.info(await Fmt.help(toolname, cwd));
  await PullMigrate.run(cwd);

  /* Run */
  console.info(await Fmt.header(toolname));
  const res = await run(cwd);
  console.info(Fmt.signoff(toolname));

  /* Exit */
  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */
async function run(cwd: t.StringDir): Promise<t.RunReturn> {
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
