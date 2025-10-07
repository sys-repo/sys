import type { ErrLib } from './t.ts';

import { Is } from './m.Is.ts';
import { Name } from './m.Name.ts';
import { errors } from './u.errors.ts';
import { std } from './u.std.ts';
import { tryCatch } from './u.tryCatchError.ts';

/**
 * Helpers for working with errors.
 */
export const Err: ErrLib = {
  Is,
  Name,
  std,
  errors,
  tryCatch,
};
