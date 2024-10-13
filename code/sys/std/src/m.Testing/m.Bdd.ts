import { describe, expect, it, type t } from './common.ts';
import { expectError } from './u.ts';

export { describe, expect, it, expectError };

/**
 * BDD semantics ("Behavior Driven Development") helpers.
 */
export const Bdd: t.BddLib = {
  describe,
  it,
  expect,
  expectError,
};
