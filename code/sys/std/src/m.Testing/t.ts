import type { describe, it } from '@std/testing/bdd';
import type { expect } from 'chai';
import type { t } from './common.ts';

/**
 * Testing helpers.
 */
export type TestingLib = {
  readonly FALSY: t.Falsy[];
  readonly Bdd: BddLib;
  slug: t.RandomLib['slug'];
  wait(delay: t.Msecs): Promise<void>;
  randomPort(): number;

  /** Attempt to run the test function <n>-times before throwing. */
  retry(times: number, fn?: TestRetryRunner): Promise<void>;
  retry(times: number, options: TestRetryOptions, fn?: TestRetryRunner): Promise<void>;
};

export type TestRetryRunner = () => t.IgnoredResult;
export type TestRetryOptions = {
  silent?: boolean;
  delay?: t.Msecs;
  message?: string;
};

/** Describes a test suite. */
export type Describe = typeof describe;

/** Defines a single BDD test. */
export type It = typeof it;

/** Assertion library (BDD). */
export type Expect = typeof expect;

/** Expect an error asyncronously */
export type ExpectError = (fn: () => Promise<any> | any, message?: string) => Promise<any>;

/**
 * BDD semantics ("Behavior Driven Development") helpers.
 */
export type BddLib = {
  readonly describe: typeof describe;
  readonly it: typeof it;
  readonly expect: typeof expect;
  readonly expectError: t.ExpectError;
};
