import { Cli } from './common.ts';

const HELP = {
  tool: 'deno run -A jsr:@sys/driver-pi/cli/raw',
  summary: 'Run raw Pi with only the @sys launch sandbox.',
  note: 'Raw mode does not load profile YAML, profile context, or the wrapper-owned default system prompt. All non-boundary args pass through to Pi unchanged.',
  usage: [
    'deno run -A jsr:@sys/driver-pi/cli/raw [--help] [--allow-all] [--git-root <walk-up|cwd|none>] [-- <pi-args...>]',
  ],
  options: [
    ['-h, --help', 'show boundary help'],
    ['-A, --allow-all', 'unsafe debug: grant the launched Pi child full Deno permissions'],
    [
      '--git-root <walk-up|cwd|none>',
      'set runtime root: git walk-up, cwd git check, or cwd without git',
    ],
  ],
  examples: [
    'deno run -A jsr:@sys/driver-pi/cli/raw',
    'deno run -A jsr:@sys/driver-pi/cli/raw -- --help',
    'deno run -A jsr:@sys/driver-pi/cli/raw --git-root cwd',
    'deno run -A jsr:@sys/driver-pi/cli/raw --allow-all',
    'deno run -A jsr:@sys/driver-pi/cli/raw -- --model gpt-5.4',
  ],
} as const;

export const PiCliFmt = {
  help() {
    return Cli.Fmt.Help.build(HELP);
  },
} as const;
