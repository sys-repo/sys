import { FilesPath } from '../m.files/u.path.ts';
import { type t } from './common.ts';
import { fail } from './u.error.ts';

export const ROOT = '/memory' as t.StringAbsolutePath;

export const path: t.FilesFs.Capability.Path = FilesPath.posix();

export const visiblePath = (input: unknown): t.Files.StringPath => {
  return FilesPath.visible(path, input, invalidPath);
};

export function absolutePath(input: t.Files.StringPath): t.StringAbsolutePath {
  return path.resolve(ROOT, input);
}

const invalidPath = (message: string): Error => fail('FilesMemoryError.InvalidPath', message);
