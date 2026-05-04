import { Cli } from './common.ts';

const HELP = {
  tool: '@sys/driver-pi/cli',
  summary: 'Run Pi behind the typed @sys Deno boundary.',
  note: 'Only boundary flags are handled locally. All other args pass through to Pi unchanged.',
  usage: [
    '@sys/driver-pi/cli [--help] [--allow-all] [--git-root <walk-up|cwd|none>] [-- <pi-args...>]',
  ],
  options: [
    ['-h, --help', 'show boundary help'],
    ['-A, --allow-all', 'unsafe debug: grant the launched Pi child full Deno permissions'],
    [
      '--git-root <walk-up|cwd|none>',
      'resolve the effective runtime root by walking git ancestors, requiring cwd git, or using cwd without git',
    ],
  ],
  examples: [
    'deno task cli',
    'deno task cli -- --help',
    'deno task cli --git-root cwd',
    'deno task cli --allow-all',
    'deno task cli -- --model gpt-5.4',
  ],
} as const;

export const PiCliFmt = {
  help() {
    return Cli.Fmt.Help.build(HELP);
  },
} as const;
