import { Fs, type t } from '../common.ts';
import { logSyncResult, removeIfExists, resolveSourcePaths } from '../u/u.source.ts';
import { write } from './u.write.ts';

export async function sync(
  args: t.WorkspaceCi.Test.Linux.SyncArgs,
): Promise<t.WorkspaceCi.SyncResult> {
  const cwd = args.cwd ?? Fs.cwd();
  const paths = await resolveSourcePaths(cwd, args.source, { task: 'test' });
  if (paths.length === 0) {
    const removed = await removeIfExists(cwd, args.target);
    const result: t.WorkspaceCi.SyncResult = removed
      ? { kind: 'removed', target: args.target, count: 0 }
      : { kind: 'skipped', target: args.target, count: 0 };
    logSyncResult('test:linux', result, { log: args.log });
    return result;
  }

  const res = await write({ cwd, env: args.env, on: args.on, paths, target: args.target });
  const result: t.WorkspaceCi.SyncResult = res.changed
    ? { kind: 'written', target: res.target, yaml: res.yaml, count: res.count }
    : { kind: 'unchanged', target: res.target, count: res.count };
  logSyncResult('test:linux', result, { log: args.log });
  return result;
}
