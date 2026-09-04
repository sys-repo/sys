import { Err, type t } from '../common.ts';

/** Create a standard Files/static error. */
export const fail = (kind: t.FilesStatic.Error.Kind, message: string): Error => {
  return Err.normalize(Err.std(message, { name: kind }));
};

/** Invalid path/config error helper for shared Files helpers. */
export const invalidPath = (message: string): Error => {
  return fail('FilesStaticError.InvalidPath', message);
};
