import { Cli, Str } from './common.ts';

const HELP_TOOL_ENV = 'PI_CLI_PROFILES_HELP_TOOL';
const DEFAULT_TOOL = 'deno run -A jsr:@sys/driver-agent/pi/cli Profiles';

function helpInput() {
  const tool = Deno.env.get(HELP_TOOL_ENV) || DEFAULT_TOOL;
  return {
    tool,
    summary: 'Launch coding agent (Pi) via persisted profile configurations within sandbox.',
    note: Str.dedent(`
      Select a saved profile config, or pass --profile or --config to run one directly.
      Defaults live in profile YAML; args after -- pass through to Pi.
    `).trim(),
    usage: [
      `${tool} [--help]`,
      `${tool} [--profile <name> | --config <path>] [-- <pi-args...>]`,
    ],
    options: [
      ['-h, --help', 'show help'],
      ['--profile <name>', 'skip the menu and load a named profile config'],
      ['--config <path>', 'skip the menu and load a profile config file'],
    ],
    examples: [
      `${tool}`,
      `${tool} --profile my-canon`,
      `${tool} -- --model gpt-5.4`,
      `${tool} --config ./my-canon.yaml`,
    ],
  } as const;
}

export const ProfilesFmt = {
  help() {
    return Cli.Fmt.Help.build(helpInput());
  },
} as const;
