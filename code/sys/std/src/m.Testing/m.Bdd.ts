import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  type t,
} from './common.ts';
import { expectError } from './u.ts';

export { afterAll, afterEach, beforeAll, beforeEach, describe, expect, expectError, it };

/**
 * BDD semantics ("Behavior Driven Development") helpers.
 */
export const Bdd: t.BddLib = {
  describe,
  it,

  beforeAll,
  beforeEach,
  afterAll,
  afterEach,

  expect,
  expectError,
};
