import { Args, type t } from './common.ts';
import { parseGitRootMode } from '../m.cli/u.git-root.ts';

export const ProfileArgs = {
  parse(argv: readonly string[] = []): t.PiCliProfiles.ParsedArgs {
    const args = Args.parse<t.PiCliProfiles.ParsedArgs & { readonly 'git-root'?: string }>([
      ...argv,
    ], {
      alias: { h: 'help' },
      boolean: ['help'],
      string: ['config', 'profile', 'git-root'],
    });
    const gitRoot = parseGitRootMode(args['git-root']);

    return {
      help: args.help === true,
      ...(args.config ? { config: args.config } : {}),
      ...(args.profile ? { profile: args.profile } : {}),
      ...(gitRoot ? { gitRoot } : {}),
      _: args._ ?? [],
    };
  },
} as const;
