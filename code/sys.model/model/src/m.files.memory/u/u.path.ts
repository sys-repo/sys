import { FilesPath } from '../../m.files/u/u.path.ts';
import { type t } from '../common.ts';
import { fail } from './u.error.ts';

export const ROOT = '/memory' as t.StringAbsolutePath;

export const path = FilesPath.posix();

export const visiblePath = (input: unknown): t.Files.String.Path => {
  return FilesPath.visible(path, input, invalidPath);
};

export const requiredVisiblePath = (input: unknown): t.Files.String.Path => {
  if (input === undefined) throw invalidPath('Files path is required');
  return visiblePath(input);
};

export function absolutePath(input: t.Files.String.Path): t.StringAbsolutePath {
  return path.resolve(ROOT, input);
}

export function relativePath(
  base: t.Files.String.Path,
  input: t.Files.String.Path,
): t.StringRelativePath {
  return path.relative(base, input).replaceAll('\\', '/') as t.StringRelativePath;
}

export function visibleFromAbsolute(input: t.StringAbsolutePath): t.Files.String.Path {
  return path.relative(ROOT, input) as t.Files.String.Path;
}

export const invalidPath = (message: string): Error => {
  return fail('FilesMemoryError.InvalidPath', message);
};
