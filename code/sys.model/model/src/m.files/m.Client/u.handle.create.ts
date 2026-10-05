import { Dispose, type t } from '../common.ts';
import { createQueryMethods } from './u.handle.query.ts';
import { createReadMethods } from './u.handle.read.ts';
import { createRemoveMethods } from './u.handle.remove.ts';
import { createWriteMethods } from './u.handle.write.ts';

/**
 * Compose a Files client handle over a raw typed Files Cmd client.
 */
export function createHandle(
  cmd: t.Files.Cmd.Client,
  owned?: t.DisposableLike,
): t.Files.Client.Handle {
  const life = Dispose.lifecycle();

  life.dispose$.subscribe((event) => {
    try {
      cmd.dispose(event.reason);
    } finally {
      owned?.dispose(event.reason);
    }
  });

  return Dispose.toLifecycle<t.Files.Client.Handle>(life, {
    cmd,
    ...createQueryMethods(cmd),
    ...createReadMethods(cmd),
    ...createWriteMethods(cmd),
    ...createRemoveMethods(cmd),
  });
}
