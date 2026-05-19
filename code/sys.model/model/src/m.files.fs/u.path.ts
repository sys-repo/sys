import { FilesPath } from '../m.files/u.path.ts';
import { type t } from './common.ts';
import { fail } from './u.error.ts';

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
  return FilesPath.visible(toBoundedPathOps(fs.path), input, invalidPath);
};

export const requiredVisiblePath = (
  fs: t.FilesFs.Capability.Readonly,
  input?: t.Files.StringPath,
): t.Files.StringPath => {
  if (input === undefined) throw invalidPath('Files path is required');
  return visiblePath(fs, input);
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

const invalidPath = (message: string): Error => fail('FilesFsError.InvalidPath', message);

const toBoundedPathOps = (path: t.FilesFs.Capability.Path): t.PathBoundedOps => ({
  isAbsolute: path.Is.absolute,
  normalize: path.normalize,
});

const assertInside = (scope: Scope, path: t.StringPath) => {
  const relative = scope.fs.path.relative(scope.root, path).replaceAll('\\', '/');
  const outside = relative === '..' ||
    relative.startsWith('../') ||
    scope.fs.path.Is.absolute(relative) ||
    FilesPath.Is.windowsDrive(relative);

  if (outside) throw fail('FilesFsError.PathOutsideRoot', 'Files path escapes the bounded root');
};
