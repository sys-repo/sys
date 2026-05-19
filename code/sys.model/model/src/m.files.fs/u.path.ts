import { FilesPath } from '../m.files/u.path.ts';
import { type t } from './common.ts';
import { fail } from './u.error.ts';

export type Scope = {
  readonly fs: t.FilesFs.Capability.Readonly;
  readonly root: t.StringAbsolutePath;
};

export const scope = (fs: t.FilesFs.Capability.Readonly, root: t.StringPath): Scope => {
  const absolute = fs.Path.resolve(root);
  return { fs, root: absolute };
};

export const visiblePath = (
  fs: t.FilesFs.Capability.Readonly,
  input?: t.Files.StringPath,
): t.Files.StringPath => {
  return FilesPath.visible(toBoundedPathOps(fs.Path), input, invalidPath);
};

export const requiredVisiblePath = (
  fs: t.FilesFs.Capability.Readonly,
  input?: t.Files.StringPath,
): t.Files.StringPath => {
  if (input === undefined) throw invalidPath('Files path is required');
  return visiblePath(fs, input);
};

export const absolutePath = (scope: Scope, path: t.Files.StringPath): t.StringAbsolutePath => {
  const target = path ? scope.fs.Path.resolve(scope.root, path) : scope.root;
  assertInside(scope, target);
  return target;
};

export const relativePath = (scope: Scope, path: t.StringPath): t.Files.StringPath => {
  const absolute = scope.fs.Path.Is.absolute(path) ? path : scope.fs.Path.resolve(scope.root, path);
  assertInside(scope, absolute);
  const relative = scope.fs.Path.relative(scope.root, absolute).replaceAll('\\', '/');
  return visiblePath(scope.fs, relative);
};

export const realScope = async (scope: Scope): Promise<Scope> => {
  const root = await scope.fs.realPath(scope.root);
  if (!root) throw fail('FilesFsError.NotFound', 'Files root does not exist');
  return { ...scope, root };
};

export const assertRealInside = async (
  scope: Scope,
  absolute: t.StringAbsolutePath,
): Promise<t.StringAbsolutePath | undefined> => {
  return assertInsideRealScope(await realScope(scope), absolute);
};

export const assertInsideRealScope = async (
  scope: Scope,
  absolute: t.StringAbsolutePath,
): Promise<t.StringAbsolutePath | undefined> => {
  const target = await scope.fs.realPath(absolute);
  if (!target) return undefined;

  assertInside(scope, target);
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
  const relative = scope.fs.Path.relative(scope.root, path).replaceAll('\\', '/');
  const outside = relative === '..' ||
    relative.startsWith('../') ||
    scope.fs.Path.Is.absolute(relative) ||
    FilesPath.Is.windowsDrive(relative);

  if (outside) throw fail('FilesFsError.PathOutsideRoot', 'Files path escapes the bounded root');
};
