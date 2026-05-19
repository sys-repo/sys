import { Err, type t } from './common.ts';

const FS_PREFIX = 'FilesFsError.';
const MEMORY_PREFIX = 'FilesMemoryError.';

export const fail = (kind: t.FilesMemory.Error.Kind, message: string): Error => {
  return Err.normalize(Err.std(message, { name: kind }));
};

export const translate = (error: unknown): Error => {
  const err = Err.normalize(error);
  if (!err.name.startsWith(FS_PREFIX)) return err;

  const suffix = err.name.slice(FS_PREFIX.length);
  const name = `${MEMORY_PREFIX}${suffix}` as t.FilesMemory.Error.Kind;
  return fail(name, err.message);
};
