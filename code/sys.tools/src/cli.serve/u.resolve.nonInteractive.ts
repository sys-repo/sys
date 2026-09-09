import { type t } from './common.ts';
import { resolveServeHost } from './u.startOptions.ts';
import { loadStartTarget } from './u.startTarget.ts';

type Resolved = t.ServeTool.StartTarget & {
  readonly host: t.ServeTool.Host;
  readonly open: boolean;
};

export async function resolveNonInteractive(
  cwd: t.StringDir,
  args: t.ServeTool.CliParsedArgs,
): Promise<Resolved> {
  const host = resolveServeHost(args.host, '@sys/tools/serve');
  const open = args.open === true;
  const target = await loadStartTarget(cwd, args, '@sys/tools/serve');

  return { ...target, host, open };
}
