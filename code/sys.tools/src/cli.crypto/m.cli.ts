import { type t, c, Cli, D, done, Fs, Is, opt } from './common.ts';
import { parseArgs } from './u.args.ts';
import { Fmt } from './u.fmt.ts';
import { promptTemplateVariant } from './u.menu.ts';
import { cloneTemplate } from './u.tmpl/mod.ts';
import { hashCurrentDir } from './cmd.hash/mod.ts';
// [tmpl:variant.imports]
import { yamlConfigsMenu } from './u.menu.yaml.ts';
import { CryptoMigrate } from './u.yaml/mod.ts';

/**
 * Main entry:
 */
export const cli: t.CryptoToolsLib['cli'] = async (cwd, argv) => {
  const args = parseArgs(argv);
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');

  if (args.help) return void console.info(await Fmt.help(toolname, cwd));
  // [tmpl:variant.migrate]
await CryptoMigrate.run(cwd);

  /* Run */
  console.info(await Fmt.header(toolname));
  const res = await run(cwd, args);
  console.info(Fmt.signoff(toolname));

  /* Exit */
  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */
async function run(cwd: t.StringDir, _args: t.CryptoTool.CliArgs): Promise<t.RunReturn> {
  /** --------------------------------------------------------
   * Root Menu (Loop)
   */
  while (true) {
    console.info();
    const A = (await Cli.Input.Select.prompt<t.CryptoTool.MenuCmd>({
      message: 'Tools:\n',
      options: [
        opt(` hash ${c.gray('current dir')} ${c.dim(`→ ${Fs.basename(cwd)}`)}`, 'hash:cwd'),
        opt(` Option A (clone \`-tmpl\` as new ${c.green('tool')})`, 'option-a'),
        opt(' YAML Configs', 'config'),
        opt(c.gray('(quit)'), 'exit'),
      ],
      hideDefault: true,
    })) as t.CryptoTool.MenuCmd;

    if (A === 'hash:cwd') {
      await hashCurrentDir(cwd);
      continue;
    }

    /** --------------------------------------------------------
     * Sub-Menu: A
     */
    if (A === 'option-a') {
      const variant = await promptTemplateVariant();
      if (!variant) continue;
      await cloneTemplate(cwd, variant);
      return done(0);
    }

    /** --------------------------------------------------------
     * Sub-Menu: B
     */
    // [tmpl:variant.option-b:start]
if (A === 'config') {
      const picked = await yamlConfigsMenu(cwd);
      if (picked.kind === 'exit') return done(0);
      if (picked.kind === 'selected') {
        console.info(c.gray(`config: ${picked.key}`));
      }
      continue;
    }
// [tmpl:variant.option-b:end]

    if (A === 'exit') return done(0);
  }

  /** --------------------------------------------------------
   * End
   */
  return done(0);
}
