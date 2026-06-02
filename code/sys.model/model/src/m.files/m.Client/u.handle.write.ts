import { type t } from '../common.ts';
import { Cmd } from '../m.Cmd.ts';
import { writeBytesError, writeTextError } from './u.error.ts';

type WriteMethods = Pick<t.Files.Client.Handle, 'writeText' | 'writeBytes'>;

/**
 * Create write-oriented Files client handle methods.
 */
export function createWriteMethods(cmd: t.Files.Cmd.Client): WriteMethods {
  const writeText: t.Files.Client.Handle['writeText'] = async (path, content, options) => {
    try {
      return await cmd.send(Cmd.Name.write, { ...options, kind: 'text', path, content });
    } catch (cause) {
      throw writeTextError(path, cause);
    }
  };

  const writeBytes: t.Files.Client.Handle['writeBytes'] = async (path, content, options) => {
    try {
      return await cmd.send(Cmd.Name.write, { ...options, kind: 'bytes', path, content });
    } catch (cause) {
      throw writeBytesError(path, cause);
    }
  };

  return { writeText, writeBytes };
}
