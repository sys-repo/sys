import { Cli } from './common.ts';

const HELP_TOOL_ENV = 'PI_CLI_PROFILES_HELP_TOOL';
const DEFAULT_TOOL = 'deno run -A jsr:@sys/driver-agent/pi/cli Profiles';

function helpInput() {
  const tool = Deno.env.get(HELP_TOOL_ENV) || DEFAULT_TOOL;
  return {
    tool,
    summary: 'Launch Pi via persisted profile configs.',
    note:
      'Select a saved profile config, or pass --config to run one directly. Args after -- pass through to Pi.',
    usage: [
      `${tool} [--help]`,
      `${tool} [--config <path>] [-- <pi-args...>]`,
    ],
    options: [
      ['-h, --help', 'show help'],
      ['--config <path>', 'skip the menu and load a profile config file'],
    ],
    examples: [
      `${tool}`,
      `${tool} -- --model gpt-5.4`,
      `${tool} --config ./my-config.yaml`,
    ],
  } as const;
}

export const ProfilesFmt = {
  help() {
    return Cli.Fmt.Help.build(helpInput());
  },
} as const;
