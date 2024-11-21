import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { Name } from './m.Name.ts';
import { errors } from './u.errors.ts';
import { std } from './u.std.ts';
import { catchError } from './u.catchError.ts';

/**
 * Helpers for working with errors.
 */
export const Err: t.ErrLib = {
  Is,
  Name,
  std,
  errors,
  catch: catchError,
};
