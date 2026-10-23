import { Err, type t } from '../common.ts';

export const fail = (kind: t.FilesMemory.Error.Kind, message: string): Error => {
  return Err.normalize(Err.std(message, { name: kind }));
};

export const translate = (error: unknown): Error => {
  return Err.normalize(error);
};
