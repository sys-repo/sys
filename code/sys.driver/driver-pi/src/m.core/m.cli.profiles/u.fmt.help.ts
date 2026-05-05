import { Cli, Str } from './common.ts';

const HELP_TOOL_ENV = 'PI_CLI_PROFILES_HELP_TOOL';
const ROOT_TOOL = 'deno run -A jsr:@sys/driver-pi';
const DEFAULT_TOOL = `${ROOT_TOOL}/cli`;

function helpInput() {
  const tool = Deno.env.get(HELP_TOOL_ENV) || DEFAULT_TOOL;
  return {
    tool,
    summary: 'Run Pi as a profile-driven system agent with an explicit launch sandbox.',
    note: Str.dedent(`
      Select a saved profile by name, or pass a YAML path with --profile.
      Defaults live in profile YAML; args after -- pass through to Pi.
    `).trim(),
    usage: [
      `${tool} [--help] [--allow-all] [--git-root <walk-up|cwd|none>]`,
      `${tool} --profile <name|path> [--allow-all] [--git-root <walk-up|cwd|none>] [-- <pi-args...>]`,
      `${tool} --non-interactive --profile <name|path> [-- <pi-args...>]`,
    ],
    options: [
      ['-h, --help', 'show help'],
      ['-A, --allow-all', 'unsafe debug: grant the launched Pi child full Deno permissions'],
      ['--non-interactive', 'disable prompts and require --profile'],
      ['--profile <name|path>', 'skip the menu and load a named profile or YAML file'],
      [
        '--git-root <walk-up|cwd|none>',
        'set runtime root: git walk-up, cwd git check, or cwd without git',
      ],
    ],
    examples: [
      ...(tool === DEFAULT_TOOL ? [`${ROOT_TOOL}      # alias of /cli`] : []),
      `${tool}`,
      `${tool} --profile my-canon`,
      `${tool} --profile ./profiles/my-canon.yaml`,
      `${tool} --non-interactive --profile default`,
      `${tool} --git-root cwd`,
      `${tool} --git-root none --profile ./profiles/default.yaml`,
      `${tool} --allow-all`,
      `${tool} -- --model gpt-5.4`,
    ],
  } as const;
}

export const ProfilesFmt = {
  help() {
    return Cli.Fmt.Help.build(helpInput());
  },
} as const;
