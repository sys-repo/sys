import { Is, type t } from './common.ts';
import { fail } from './u.error.ts';

const WINDOWS_DRIVE = /^[a-zA-Z]:/;

export type Scope = {
  readonly fs: t.FilesFs.Capability.Readonly;
  readonly root: t.StringAbsolutePath;
};

export const scope = (fs: t.FilesFs.Capability.Readonly, root: t.StringPath): Scope => {
  const absolute = fs.path.resolve(root);
  return { fs, root: absolute };
};

export const visiblePath = (
  fs: t.FilesFs.Capability.Readonly,
  input?: t.Files.StringPath,
): t.Files.StringPath => {
  if (input === undefined || input === '' || input === '.') return '';
  if (!Is.string(input)) throw fail('FilesFsError.InvalidPath', 'Files path must be a string');
  if (input.includes('\0')) throw fail('FilesFsError.InvalidPath', 'Files path contains NUL');
  if (input.includes('\\')) {
    throw fail('FilesFsError.InvalidPath', 'Files path must use POSIX separators');
  }
  if (fs.path.Is.absolute(input) || WINDOWS_DRIVE.test(input)) {
    throw fail('FilesFsError.InvalidPath', 'Files path must be root-relative');
  }

  const normalized = fs.path.normalize(input).replaceAll('\\', '/');
  const path = normalized === '.' ? '' : normalized.replace(/^\.\/+/, '');
  if (path === '..' || path.startsWith('../') || path.includes('/../')) {
    throw fail('FilesFsError.InvalidPath', 'Files path cannot traverse above root');
  }
  if (path.startsWith('/') || WINDOWS_DRIVE.test(path)) {
    throw fail('FilesFsError.InvalidPath', 'Files path must be root-relative');
  }
  return path;
};

export const absolutePath = (scope: Scope, path: t.Files.StringPath): t.StringAbsolutePath => {
  const target = path ? scope.fs.path.resolve(scope.root, path) : scope.root;
  assertInside(scope, target);
  return target;
};

export const relativePath = (scope: Scope, path: t.StringPath): t.Files.StringPath => {
  const absolute = scope.fs.path.Is.absolute(path) ? path : scope.fs.path.resolve(scope.root, path);
  assertInside(scope, absolute);
  const relative = scope.fs.path.relative(scope.root, absolute).replaceAll('\\', '/');
  return visiblePath(scope.fs, relative);
};

export const assertRealInside = async (
  scope: Scope,
  absolute: t.StringAbsolutePath,
): Promise<t.StringAbsolutePath | undefined> => {
  const root = await scope.fs.realPath(scope.root);
  if (!root) throw fail('FilesFsError.NotFound', 'Files root does not exist');

  const target = await scope.fs.realPath(absolute);
  if (!target) return undefined;

  const realScope = { ...scope, root };
  assertInside(realScope, target);
  return target;
};

/**
 * Helpers:
 */

const assertInside = (scope: Scope, path: t.StringPath) => {
  const relative = scope.fs.path.relative(scope.root, path).replaceAll('\\', '/');
  const outside = relative === '..' ||
    relative.startsWith('../') ||
    scope.fs.path.Is.absolute(relative) ||
    WINDOWS_DRIVE.test(relative);

  if (outside) throw fail('FilesFsError.PathOutsideRoot', 'Files path escapes the bounded root');
};
