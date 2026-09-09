import { type t } from '../common.ts';
import { Cmd } from '../m.Cmd.ts';
import { contentRefUnavailable, readTextError, truncatedRead } from './u.error.ts';

type ReadMethods = Pick<t.Files.Client.Handle, 'readText'>;

/**
 * Create read-oriented Files client handle methods.
 */
export function createReadMethods(cmd: t.Files.Cmd.Client): ReadMethods {
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

  return { readText };
}
