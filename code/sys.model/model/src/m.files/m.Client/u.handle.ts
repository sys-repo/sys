import { Dispose, type t } from '../common.ts';
import { Cmd } from '../m.Cmd.ts';
import { contentRefUnavailable, readTextError, truncatedRead } from './u.error.ts';

/** Compose a humane Files client handle over a raw typed Files Cmd client. */
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

  const readText: t.Files.Client.Handle['readText'] = async (path, options) => {
    let result: t.Files.Cmd.Read.Result;

    try {
      result = await cmd.send(Cmd.Name.read, { ...options, path });
    } catch (cause) {
      throw readTextError(path, cause);
    }

    if (result.kind === 'inline') {
      if (result.truncated && options?.maxBytes === undefined) throw truncatedRead(path);
      return result.content;
    }

    throw contentRefUnavailable(path);
  };

  return Dispose.toLifecycle<t.Files.Client.Handle>(life, { cmd, readText });
}

