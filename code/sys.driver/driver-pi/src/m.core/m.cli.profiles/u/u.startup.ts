import { Cli, type t } from '../common.ts';
import { resolveCwd } from '../../m.cli/u.resolve.cwd.ts';
import { runtimeRoot } from '../../m.cli/u.runtime.ts';
import { ProfileMigrate } from '../u.migrate/mod.ts';

type StartupFeedback = { readonly stop: () => void };
type ResolveArgs = {
  readonly input: t.PiCliProfiles.Input;
  readonly parsed: t.PiCliProfiles.ParsedArgs;
};

type ResolveResult = ResolveExit | ResolveReady;
type ResolveExit = { readonly kind: 'exit' };
type ResolveReady = {
  readonly kind: 'ready';
  readonly cwd: t.PiCli.Cwd;
  readonly root: t.StringDir;
  readonly migrationMessage?: string;
};

export const ProfileStartup = {
  async resolve(args: ResolveArgs): Promise<ResolveResult> {
    const tty = resolveTty(args.input);
    const canOpenProfileMenu = tty.stdin && tty.stdout;
    if (!args.parsed.profile && !canOpenProfileMenu) throw new Error(ProfileMenuNonTtyError);

    let feedback: StartupFeedback | undefined;
    try {
      const resolvedCwd = await resolveCwd(args.input.cwd, {
        gitRoot: args.parsed.gitRoot,
        interactive: args.parsed.nonInteractive !== true && canOpenProfileMenu,
      });
      if (resolvedCwd.kind === 'exit') return { kind: 'exit' };

      feedback = startFeedback({
        parsed: args.parsed,
        canOpenProfileMenu,
        processTty: args.input.tty === undefined,
      });
      const cwd = resolvedCwd.cwd;
      const root = runtimeRoot(cwd);
      const migration = await ProfileMigrate.dir(root);
      return {
        kind: 'ready',
        cwd,
        root,
        migrationMessage: ProfileMigrate.message(migration),
      };
    } finally {
      feedback?.stop();
    }
  },
} as const;

/**
 * Helpers:
 */

const ProfileMenuNonTtyError = [
  'Cannot open the interactive profile menu because stdin/stdout is not a TTY.',
  'Pass --profile <name|path>, or use --non-interactive --profile <name|path>.',
  'Use --help for wrapper help; args after -- are passed to Pi after a profile is selected.',
].join(' ');

function resolveTty(input: t.PiCliProfiles.Input): t.PiCliProfiles.Tty {
  return input.tty ?? {
    stdin: Cli.Is.terminal('stdin'),
    stdout: Cli.Is.terminal('stdout'),
  };
}

function startFeedback(args: {
  readonly parsed: t.PiCliProfiles.ParsedArgs;
  readonly canOpenProfileMenu: boolean;
  readonly processTty: boolean;
}): StartupFeedback | undefined {
  if (!args.processTty || !args.canOpenProfileMenu) return undefined;
  if (args.parsed.help || args.parsed.nonInteractive) return undefined;

  const text = args.parsed.profile ? 'loading profile...' : 'loading profiles...';
  const spinner = Cli.spinner(Cli.Fmt.spinnerText(text));
  spinner.start();

  let active = true;
  return {
    stop() {
      if (!active) return;
      active = false;
      spinner.stop();
    },
  };
}
