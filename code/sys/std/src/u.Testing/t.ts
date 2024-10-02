import type { t } from '../common.ts';
import type { describe, it } from '@std/testing/bdd';
import type { expect } from 'chai';

/**
 * Testing helpers.
 */
export type Testing = {
  readonly Bdd: BddLib;
  wait(delay: t.Msecs): Promise<void>;
  randomPort(): number;
  slug: t.IdGenerator;
};

/**
 * BDD semantics ("Behavior Driven Development") helpers.
 */
export type BddLib = {
  readonly expect: typeof expect;
  readonly describe: typeof describe;
  readonly it: typeof it;
};
