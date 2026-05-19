import { FilesPath } from '../m.files/u.path.ts';
import { type t } from './common.ts';
import { invalidPath } from './u.error.ts';

const path = FilesPath.posix();

export const visiblePath = (input?: t.Files.StringPath): t.Files.StringPath => {
  return FilesPath.visible(path, input, invalidPath);
};

export const requiredVisiblePath = (input?: t.Files.StringPath): t.Files.StringPath => {
  if (input === undefined) throw invalidPath('Files path is required');
  return visiblePath(input);
};

export const parentPath = (input: t.Files.StringPath): t.Files.StringPath => {
  return FilesPath.parent(input, invalidPath);
};

export const relativePath = (from: t.Files.StringPath, to: t.Files.StringPath) => {
  return path.relative(from, to).replaceAll('\\', '/') as t.Files.StringPath;
};
