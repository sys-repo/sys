import { FilesPath } from '../../m.files/u/u.path.ts';
import { type t } from '../common.ts';
import type * as TCapability from '../t/t.capability.ts';
import { fail } from './u.error.ts';

export type Scope<Fs extends t.FilesFs.Capability.Readonly = t.FilesFs.Capability.Readonly> = {
  readonly fs: Fs;
  readonly root: t.StringAbsolutePath;
};

export const scope = <Fs extends t.FilesFs.Capability.Readonly>(
  fs: Fs,
  root: t.StringPath,
): Scope<Fs> => {
  const absolute = fs.Path.resolve(root);
  return { fs, root: absolute };
};

export const visiblePath = (
  fs: t.FilesFs.Capability.Readonly,
  input?: t.Files.String.Path,
): t.Files.String.Path => {
  return FilesPath.visible(toBoundedPathOps(fs.Path), input, invalidPath);
};

export const requiredVisiblePath = (
  fs: t.FilesFs.Capability.Readonly,
  input?: t.Files.String.Path,
): t.Files.String.Path => {
  if (input === undefined) throw invalidPath('Files path is required');
  return visiblePath(fs, input);
};

export const absolutePath = (scope: Scope, path: t.Files.String.Path): t.StringAbsolutePath => {
  const target = path ? scope.fs.Path.resolve(scope.root, path) : scope.root;
  assertInside(scope, target);
  return target;
};

export const relativePath = (scope: Scope, path: t.StringPath): t.Files.String.Path => {
  const absolute = scope.fs.Path.Is.absolute(path) ? path : scope.fs.Path.resolve(scope.root, path);
  assertInside(scope, absolute);
  const relative = scope.fs.Path.relative(scope.root, absolute).replaceAll('\\', '/');
  return visiblePath(scope.fs, relative);
};

export const realScope = async <Fs extends t.FilesFs.Capability.Readonly>(
  scope: Scope<Fs>,
): Promise<Scope<Fs>> => {
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

const toBoundedPathOps = (path: TCapability.Path): t.PathBounded.Ops => ({
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
