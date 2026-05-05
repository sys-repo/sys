import { Args, type t } from './common.ts';
import { parseGitRootMode } from '../m.cli/u.git-root.ts';

export const ProfileArgs = {
  parse(argv: readonly string[] = []): t.PiCliProfiles.ParsedArgs {
    const args = Args.parse<
      t.PiCliProfiles.ParsedArgs & {
        readonly 'allow-all'?: boolean;
        readonly 'non-interactive'?: boolean;
        readonly 'git-root'?: string;
        readonly config?: string;
      }
    >([
      ...argv,
    ], {
      alias: { h: 'help', A: 'allow-all' },
      boolean: ['help', 'allow-all', 'non-interactive'],
      string: ['config', 'profile', 'git-root'],
    });
    if (args.config !== undefined && args.help !== true) {
      throw new Error('--config has been replaced by --profile <name|path>.');
    }
    const gitRoot = parseGitRootMode(args['git-root']);

    return {
      help: args.help === true,
      ...(args['allow-all'] === true ? { allowAll: true } : {}),
      ...(args['non-interactive'] === true ? { nonInteractive: true } : {}),
      ...(args.profile ? { profile: args.profile } : {}),
      ...(gitRoot ? { gitRoot } : {}),
      _: args._ ?? [],
    };
  },
} as const;
