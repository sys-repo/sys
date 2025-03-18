import type { describe, it, beforeAll, beforeEach, afterAll, afterEach } from '@std/testing/bdd';
import type { expect } from 'chai';
import type { t } from './common.ts';

/**
 * Testing helpers.
 */
export type TestingLib = {
  readonly FALSY: t.Falsy[];
  readonly Bdd: BddLib;
  slug: t.RandomLib['slug'];

  /** Wait for n-milliseconds, or a "tick" (micrso-task queue) if no delay specified. */
  wait(delay?: t.Msecs): Promise<void>;

  /** Generate a random (unused) port number. */
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

/** Run some shared setup before all of the tests in the group.  */
export type BeforeAll = typeof beforeAll;
/** Run some shared setup before each test in the suite. */
export type BeforeEach = typeof beforeEach;

/** Run some shared teardown after all of the tests in the suite. */
export type AfterAll = typeof afterAll;
/** Run some shared teardown after each test in the suite. */
export type AfterEach = typeof afterEach;

/**
 * BDD semantics ("Behavior Driven Development") helpers.
 */
export type BddLib = {
  readonly describe: Describe;
  readonly it: It;

  readonly beforeAll: BeforeAll;
  readonly afterAll: AfterAll;

  readonly beforeEach: BeforeEach;
  readonly afterEach: AfterEach;

  readonly expect: Expect;
  readonly expectError: t.ExpectError;
};
