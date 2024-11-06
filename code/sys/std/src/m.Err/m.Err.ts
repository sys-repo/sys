import type { t } from './common.ts';
import { Is } from './m.Err.Is.ts';
import { Name } from './m.Err.Name.ts';
import { errors } from './u.errors.ts';
import { std } from './u.std.ts';

/**
 * Helpers for working with errors.
 */
export const Err: t.ErrLib = {
  Is,
  Name,
  std,
  errors,
};
