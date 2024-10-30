import type { t } from './common.ts';
export * from '../common/t.ts';

/**
 * Harness.
 */
export type TestArgs = {
  readonly expect: t.Expect;
  readonly describe: t.Describe;
  readonly it: t.It;
};

/**
 * Sample test type.
 */
export type C = C1 | C2;

/**
 * Sample test type.
 */
export type C1 = t.CmdType<'Foo', { foo: number }>;

/**
 * Sample test type.
 */
export type C2 = t.CmdType<'Bar', { msg?: string }>;

/**
 * @module
 * Testing tools.
 * ────────────────────────
 * Unit test factory for the <Cmd> system allowing different
 * kinds of source <ImmutableRef> and <Patch> types to be tested
 * against the same standard test suite.
 */
export type CmdTestsLib = {
  /** Run all suites. */
  readonly all: CmdTestSuitesRun;

  /** Index of test suites. */
  readonly Index: {
    /** Primary <Cmd> tests. */
    readonly cmd: CmdTestSuitesRun;

    /** <Cmd> events tests. */
    readonly events: CmdTestSuitesRun;

    /** <Cmd> object-path tests. */
    readonly path: CmdTestSuitesRun;

    /** <Cmd> change patch helper tests. */
    readonly patch: CmdTestSuitesRun;

    /** <Cmd> type checker flag helper tests. */
    readonly flags: CmdTestSuitesRun;

    /** <Cmd> method invokcation tests. */
    readonly method: CmdTestSuitesRun;

    /** <Cmd> exeuction queue tests. */
    readonly queue: CmdTestSuitesRun;
  };
};

/**
 * Runs a suite of tests.
 */
export type CmdTestSuitesRun = (setup: t.CmdTestSetup, args: t.TestArgs) => void;
