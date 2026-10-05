import type { Bdd as BddRunner } from '@sys/types/testing';
import type { t } from './common.ts';

/**
 * Testing helper contracts.
 */
export namespace Testing {
  /**
   * Testing helpers.
   */
  export type Lib = {
    readonly FALSY: t.Falsy[];
    slug: t.Random.Lib['slug'];

    /** Wait for n-milliseconds, or a "tick" (micrso-task queue) if no delay specified. */
    wait(delay?: t.Msecs): Promise<void>;

    /** Generate a random (unused) port number. */
    randomPort(): number;

    /** Attempt to run the test function <n>-times before throwing. */
    retry(times: number, fn?: TestRetryRunner): Promise<void>;
    retry(times: number, options: TestRetryOptions, fn?: TestRetryRunner): Promise<void>;

    /**
     * Poll until `pred()` returns true. Uses retry under the hood.
     * @param pred    Synchronous or async predicate.
     * @param options times: max attempts (default 50), delay: ms between (default 5)
     */
    until(
      pred: () => boolean | Promise<boolean>,
      options?: { times?: number; delay?: t.Msecs },
    ): Promise<void>;
  };

  /**
   * HTTP server testing helper contracts.
   */
  export namespace Server {
    /**
     * Library: HTTP testing helpers.
     */
    export type Lib = Testing.Lib & {
      /** Helpers for working with an HTTP server. */
      readonly Http: t.TestHttpServer;
    };
  }
}

export type TestRetryRunner = () => t.IgnoredResult;
export type TestRetryOptions = {
  silent?: boolean;
  delay?: t.Msecs;
  message?: string;
};

/** Describes a test suite. */
export type Describe = BddRunner.Describe;

/** Defines a single BDD test. */
export type It = BddRunner.It;

/** Assertion library (BDD). */
export type Expect = typeof import('chai').expect;
/*
  NOTE: ↑ Import error above (VSCode only).
          The imports are actually fine (not a "real" type error) - SAFE TO IGNORE.
 */

/** Expect an error asyncronously */
export type ExpectError = (fn: () => Promise<any> | any, message?: string) => Promise<any>;

/** Run some shared setup before all of the tests in the group.  */
export type BeforeAll = BddRunner.HookRegistration;
/** Run some shared setup before each test in the suite. */
export type BeforeEach = BddRunner.HookRegistration;

/** Run some shared teardown after all of the tests in the suite. */
export type AfterAll = BddRunner.HookRegistration;
/** Run some shared teardown after each test in the suite. */
export type AfterEach = BddRunner.HookRegistration;
