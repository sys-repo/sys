import { type t } from '../common.ts';
import { logSyncResult, removeIfExists, resolveSourcePaths } from '../u.source.ts';
import { filterModules } from './u.filter.ts';
import { write } from './u.write.ts';

export async function sync(args: t.MonorepoCi.Jsr.SyncArgs): Promise<t.MonorepoCi.SyncResult> {
  const cwd = args.cwd ?? Deno.cwd();
  const sourcePaths = await resolveSourcePaths(cwd, args.source, { named: true });
  const paths = (await filterModules(cwd, sourcePaths, args.versionFilter)).map(
    (module) => module.path,
  );
  if (paths.length === 0) {
    const removed = await removeIfExists(cwd, args.target);
    const result: t.MonorepoCi.SyncResult = removed
      ? { kind: 'removed', target: args.target, count: 0 }
      : { kind: 'skipped', target: args.target, count: 0 };
    logSyncResult('jsr', result, { log: args.log });
    return result;
  }

  const res = await write({
    cwd,
    env: args.env,
    on: args.on,
    paths,
    target: args.target,
  });
  const result: t.MonorepoCi.SyncResult = { kind: 'written', ...res };
  logSyncResult('jsr', result, { log: args.log });
  return result;
}
