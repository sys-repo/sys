import { Args, type t } from './common.ts';

export const ProfileArgs = {
  parse(argv: readonly string[] = []): t.PiCliProfiles.ParsedArgs {
    const args = Args.parse<t.PiCliProfiles.ParsedArgs>([...argv], {
      alias: { h: 'help' },
      boolean: ['help'],
      string: ['config', 'profile'],
    });

    return {
      help: args.help === true,
      ...(args.config ? { config: args.config } : {}),
      ...(args.profile ? { profile: args.profile } : {}),
      _: args._ ?? [],
    };
  },
} as const;
