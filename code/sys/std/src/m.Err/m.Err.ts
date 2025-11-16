import { type t } from './common.ts';

import { Try } from './common.ts';
import { Is } from './m.Is.ts';
import { Name } from './m.Name.ts';
import { errors } from './u.errors.ts';
import { normalize } from './u.normalize.ts';
import { std } from './u.std.ts';

/**
 * Helpers for working with errors.
 */
export const Err: t.ErrLib = {
  Is,
  Name,
  Try,
  std,
  errors,
  normalize,
};
