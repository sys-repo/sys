import { Cli } from './common.ts';

const HELP = {
  tool: '@sys/driver-agent/pi/cli Profiles',
  summary: 'Launch Pi via persisted environment profiles.',
  note:
    'Select a saved profile, or pass --config to run one directly. Args after -- pass through to Pi.',
  usage: [
    '@sys/driver-agent/pi/cli Profiles [--help]',
    '@sys/driver-agent/pi/cli Profiles [--config <path>] [--profile <name>] [-- <pi-args...>]',
  ],
  options: [
    ['-h, --help', 'show help'],
    ['--config <path>', 'skip the menu and load an environment profile file'],
    ['--profile <name>', 'run a named profile'],
  ],
  examples: [
    'deno task cli:profiles',
    'deno task cli:profiles -- --model gpt-5.4',
    'deno task cli:profiles -- --config ./path/my-env.yaml --profile default',
  ],
} as const;

export const ProfilesFmt = {
  help() {
    return Cli.Fmt.Help.build(HELP);
  },
} as const;
