import { FilesPath } from '../../m.files/u/u.path.ts';
import { type t } from '../common.ts';
import { invalidPath } from './u.error.ts';

const path = FilesPath.posix();

export const visiblePath = (input?: t.Files.String.Path): t.Files.String.Path => {
  return FilesPath.visible(path, input, invalidPath);
};

export const requiredVisiblePath = (input?: t.Files.String.Path): t.Files.String.Path => {
  if (input === undefined) throw invalidPath('Files path is required');
  return visiblePath(input);
};

export const parentPath = (input: t.Files.String.Path): t.Files.String.Path => {
  return FilesPath.parent(input, invalidPath);
};

export const relativePath = (from: t.Files.String.Path, to: t.Files.String.Path) => {
  return path.relative(from, to).replaceAll('\\', '/') as t.Files.String.Path;
};
