import { Err, type t } from '../common.ts';

/**
 * Create a standard Files/fs error.
 */
export const fail = (kind: t.FilesFs.Error.Kind, message: string) => {
  return Err.normalize(Err.std(message, { name: kind }));
};
