import { type t } from '../common.ts';
import { fail } from './u.error.ts';
import { assertInsideRealScope, type Scope } from './u.path.ts';

/** True when an error already belongs to the public files/fs error surface. */
export const isFilesFsError = (cause: unknown): cause is Error => {
  return cause instanceof Error && cause.name.startsWith('FilesFsError.');
};

/** Re-throw files/fs errors and sanitize all other host/backing failures. */
export const throwFilesFsOrUnsupported = (cause: unknown, message: string): never => {
  if (isFilesFsError(cause)) throw cause;
  throw fail('FilesFsError.Unsupported', message);
};

/** Require a backing absolute path to resolve inside the canonical root. */
export const requireInsideRealScope = async (
  scope: Scope,
  absolute: t.StringAbsolutePath,
  notFoundMessage: string,
): Promise<t.StringAbsolutePath> => {
  const real = await assertInsideRealScope(scope, absolute);
  if (!real) throw fail('FilesFsError.NotFound', notFoundMessage);
  return real;
};

/** Reject mutation through symlink entries, preserving escape errors when applicable. */
export const rejectSymlink = async (
  scope: Scope,
  absolute: t.StringAbsolutePath,
): Promise<never> => {
  await assertInsideRealScope(scope, absolute);
  throw fail('FilesFsError.Unsupported', 'Cannot mutate filesystem symlinks');
};
