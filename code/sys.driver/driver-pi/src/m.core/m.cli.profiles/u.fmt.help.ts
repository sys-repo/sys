import { Cli, Str } from './common.ts';

const HELP_TOOL_ENV = 'PI_CLI_PROFILES_HELP_TOOL';
const DEFAULT_TOOL = 'deno run -A jsr:@sys/driver-pi/cli Profiles';

function helpInput() {
  const tool = Deno.env.get(HELP_TOOL_ENV) || DEFAULT_TOOL;
  return {
    tool,
    summary: 'Run Pi as a profile-driven system agent behind the typed Deno boundary.',
    note: Str.dedent(`
      Select a saved profile config, or pass --profile or --config to run one directly.
      Defaults live in profile YAML; args after -- pass through to Pi.
    `).trim(),
    usage: [
      `${tool} [--help] [--allow-all] [--git-root <walk-up|cwd|none>]`,
      `${tool} [--profile <name> | --config <path>] [--allow-all] [--git-root <walk-up|cwd|none>] [-- <pi-args...>]`,
      `${tool} --non-interactive (--profile <name> | --config <path>) [-- <pi-args...>]`,
    ],
    options: [
      ['-h, --help', 'show help'],
      ['-A, --allow-all', 'unsafe debug: grant the launched Pi child full Deno permissions'],
      ['--non-interactive', 'disable prompts and require --profile or --config'],
      ['--profile <name>', 'skip the menu and load a named profile config'],
      ['--config <path>', 'skip the menu and load a profile config file'],
      [
        '--git-root <walk-up|cwd|none>',
        'resolve the effective runtime root by walking git ancestors, requiring cwd git, or using cwd without git',
      ],
    ],
    examples: [
      `${tool}`,
      `${tool} --profile my-canon`,
      `${tool} --non-interactive --profile default`,
      `${tool} --git-root cwd`,
      `${tool} --git-root none --config ./config/default.yaml`,
      `${tool} --allow-all`,
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
