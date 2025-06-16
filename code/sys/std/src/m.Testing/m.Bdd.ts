import type { BddLib } from './t.ts';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from './common.ts';
import { expectError } from './u.ts';

export { afterAll, afterEach, beforeAll, beforeEach, describe, expect, expectError, it };

/**
 * BDD semantics ("Behavior Driven Development") helpers.
 */
export const Bdd: BddLib = {
  describe,
  it,

  beforeAll,
  beforeEach,
  afterAll,
  afterEach,

  expect,
  expectError,
};
