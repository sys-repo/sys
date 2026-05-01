import { Cli } from './common.ts';

const HELP = {
  tool: '@sys/driver-pi/pi/cli',
  summary: 'Launch Pi through the @sys sandboxed CLI wrapper.',
  note: 'Only wrapper flags are handled locally. All other args pass through to Pi unchanged.',
  usage: [
    '@sys/driver-pi/pi/cli [--help] [--allow-all] [--git-root <walk-up|cwd>] [-- <pi-args...>]',
  ],
  options: [
    ['-h, --help', 'show wrapper help'],
    ['-A, --allow-all', 'unsafe debug: grant the launched Pi child full Deno permissions'],
    [
      '--git-root <walk-up|cwd>',
      'resolve the effective git root by walking ancestors or using cwd only',
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
