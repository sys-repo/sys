import { Cli } from './common.ts';

const HELP = {
  tool: '@sys/driver-agent/pi/cli',
  summary: 'Launch Pi through the @sys sandboxed CLI wrapper.',
  note: 'Only -h and --help are handled by the wrapper. All other args pass through to Pi unchanged.',
  usage: [
    '@sys/driver-agent/pi/cli [--help] [-- <pi-args...>]',
  ],
  options: [['-h, --help', 'show wrapper help']],
  examples: [
    'deno task cli',
    'deno task cli -- --help',
    'deno task cli -- --model gpt-5.4',
  ],
} as const;

export const PiCliFmt = {
  help() {
    return Cli.Fmt.Help.build(HELP);
  },
} as const;
