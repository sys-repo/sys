import { Cli } from './common.ts';

const HELP = {
  tool: '@sys/driver-agent/pi/cli Profiles',
  summary: 'Launch Pi via persisted profile configs.',
  note:
    'Select a saved profile config, or pass --config to run one directly. Args after -- pass through to Pi.',
  usage: [
    '@sys/driver-agent/pi/cli Profiles [--help]',
    '@sys/driver-agent/pi/cli Profiles [--config <path>] [-- <pi-args...>]',
  ],
  options: [
    ['-h, --help', 'show help'],
    ['--config <path>', 'skip the menu and load a profile config file'],
  ],
  examples: [
    'deno task cli:profiles',
    'deno task cli:profiles -- --model gpt-5.4',
    'deno task cli:profiles -- --config ./path/my-profile.yaml',
  ],
} as const;

export const ProfilesFmt = {
  help() {
    return Cli.Fmt.Help.build(HELP);
  },
} as const;
