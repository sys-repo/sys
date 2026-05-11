import { c, Cli, Fs, Is, type t, TemplateNames } from './common.ts';
import { cli } from './m.cli.ts';
import { type CliParsedArgs, parseArgs } from './u.args.ts';
import { FmtDslHelp } from './u.help.dsl.ts';
import { makeBundle } from './u.makeBundle.ts';
import { pkg } from '../pkg.ts';

export async function entry(argv: string[] = Deno.args) {
  try {
    const args = parseArgs(argv);
    if (args.tmpl === 'dsl') {
      await printDslHelp(args);
    } else if (args.help) {
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
  Cli.Fmt.Help.render({
    tool: `${pkg.name} ${pkg.version}`,
    summary: [
      'Scaffold system repos, packages, modules, and UI components.',
      'Use `dsl` to map scaffold prompts to the correct template, slots, command, side effects, and verification.',
    ].join('\n'),
    sections: [
      {
        kind: 'lines',
        label: 'Usage',
        items: [
          'deno run -A jsr:@sys/tmpl <template> [flags]',
          'deno run -A jsr:@sys/tmpl --non-interactive --dir <path> <template> [template-flags]',
          'deno run -A jsr:@sys/tmpl dsl [chapter...] [--format human|skill]',
        ],
      },
      {
        kind: 'pairs',
        label: 'Commands',
        items: [
          [
            'dsl',
            'explain scaffold speech acts, template choice, slots, side effects, and verification',
          ],
        ],
      },
      {
        kind: 'lines',
        label: 'Templates',
        items: TemplateNames.map((name) => `- ${name}`),
      },
      {
        kind: 'pairs',
        label: 'Options',
        items: [
          ['--dir <path>', 'target directory to create/update'],
          ['--non-interactive', 'disable prompts and require direct inputs'],
          ['--dry-run', 'write preview only'],
          ['--force', 'allow overwrite'],
          ['--bundle', 'regenerate template bundle'],
          ['-h, --help', 'show help'],
        ],
      },
      {
        kind: 'pairs',
        label: 'Template flags',
        items: [
          ['repo', 'no extra template flags; identity inferred from --dir'],
          ['pkg', '--pkgName <@scope/name>'],
          ['m.mod.ui, m.mod.ui.controller', '--name <value>'],
        ],
      },
      {
        kind: 'lines',
        label: 'Examples',
        tone: 'muted',
        items: [
          'deno run -A jsr:@sys/tmpl repo',
          'deno run -A jsr:@sys/tmpl --dir my-repo repo',
          'deno run -A jsr:@sys/tmpl --non-interactive --dir my-repo repo',
          'deno run -A jsr:@sys/tmpl --non-interactive --dir packages/foo pkg --pkgName @acme/foo',
          'deno run -A jsr:@sys/tmpl dsl',
          'deno run -A jsr:@sys/tmpl dsl m.mod.ui --format skill',
        ],
      },
    ],
  });
}

async function printDslHelp(args: CliParsedArgs) {
  assertDslArgs(args);
  const format = dslFormat(args.format);
  const path = args._.slice(1).map(String);
  console.info(await FmtDslHelp.output({ path, format }));
}

function assertDslArgs(args: CliParsedArgs) {
  const flags: string[] = [];
  if (args.bundle) flags.push('--bundle');
  if (args.dryRun) flags.push('--dry-run');
  if (args.force) flags.push('--force');
  if (args.dir !== undefined) flags.push('--dir');
  if (args.pkgName !== undefined) flags.push('--pkgName');
  if (args.name !== undefined) flags.push('--name');

  if (flags.length > 0) {
    const flag = flags.length === 1 ? 'flag' : 'flags';
    throw new Error(`Unexpected ${flag} for dsl: ${flags.join(', ')}`);
  }
}

function dslFormat(value: CliParsedArgs['format']): t.TmplCli.Dsl.Format {
  if (value === undefined) return 'human';
  if (Is.array<string | boolean>(value)) throw new Error('Repeated option for dsl: --format');
  if (!Is.str(value)) throw new Error('Option requires a value: --format');
  if (value === 'human' || value === 'skill') return value;
  throw new Error(`Unsupported dsl format: ${value} (expected: human, skill)`);
}
