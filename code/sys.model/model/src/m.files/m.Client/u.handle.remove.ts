import { type t } from '../common.ts';
import { Cmd } from '../m.Cmd.ts';
import { removeError } from './u.error.ts';

type RemoveMethods = Pick<t.Files.Client.Handle, 'remove'>;

/**
 * Create remove-oriented Files client handle methods.
 */
export function createRemoveMethods(cmd: t.Files.Cmd.Client): RemoveMethods {
  const remove: t.Files.Client.Handle['remove'] = async (path, options) => {
    try {
      return await cmd.send(Cmd.Name.remove, { ...options, path });
    } catch (cause) {
      throw removeError(path, cause);
    }
  };

  return { remove };
}
