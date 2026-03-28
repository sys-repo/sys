import { type t } from './common.ts';

/**
 * The owned native `deno info --json` CLI boundary for `@sys/workspace`.
 *
 * Keep this helper limited to invocation preparation. Parsing and normalization
 * belong in higher-level graph helpers.
 */
export function info(args: t.WorkspaceGraphCli.InfoArgs): t.WorkspaceGraphCli.InfoCommand {
  return {
    cmd: 'deno',
    cwd: args.cwd,
    args: ['info', '--json', args.root],
  };
}
