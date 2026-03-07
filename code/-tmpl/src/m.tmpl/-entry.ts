import { Fs, c } from './common.ts';
import { cli } from './m.cli.ts';
import { parseArgs } from './u.args.ts';
import { makeBundle } from './u.makeBundle.ts';
import { pkg } from '../pkg.ts';
import { TemplateNames } from './common.ts';

export async function entry(argv: string[] = Deno.args) {
  try {
    const args = parseArgs(argv);
    if (args.help) {
      printHelp();
    } else if (args.bundle) {
      await makeBundle();
    } else {
      await cli(Fs.cwd('terminal'), args);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = c.bold(c.yellow('Failed:'));
    console.info();
    console.warn(c.gray(`${failed} ${message}`));
    console.info();
    Deno.exitCode = 1;
  }
}

function printHelp() {
  const rows = [
    `${c.green(pkg.name)} ${pkg.version}`,
    '',
    c.gray('Usage:'),
    '  deno run -A jsr:@sys/tmpl <template> [flags]',
    '  deno run -A jsr:@sys/tmpl --no-interactive --dir <path> <template> [template-flags]',
    '',
    c.gray('Templates:'),
    ...TemplateNames.map((name) => `  - ${name}`),
    '',
    c.gray('Flags:'),
    '  --dir <path>          target directory',
    '  --no-interactive      disable prompts (strict mode)',
    '  --dryRun              write preview only',
    '  --force               allow overwrite',
    '  --bundle              regenerate template bundle',
    '  -h, --help            show help',
    '',
    c.gray('Template flags (non-interactive):'),
    '  pkg       -> --pkgName <@scope/name>',
    '  m.mod.ui, m.mod.ui.controller-signal -> --name <value>',
  ];
  console.info(rows.join('\n'));
}
