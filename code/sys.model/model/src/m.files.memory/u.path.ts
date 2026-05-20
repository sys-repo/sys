import { FilesPath } from '../m.files/u.path.ts';
import { type t } from './common.ts';
import { fail } from './u.error.ts';

export const ROOT = '/memory' as t.StringAbsolutePath;

export const path = FilesPath.posix() satisfies t.FilesFs.Capability.Path;

export const visiblePath = (input: unknown): t.Files.String.Path => {
  return FilesPath.visible(path, input, invalidPath);
};

export function absolutePath(input: t.Files.String.Path): t.StringAbsolutePath {
  return path.resolve(ROOT, input);
}

const invalidPath = (message: string): Error => fail('FilesMemoryError.InvalidPath', message);
