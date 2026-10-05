import type { Is, t } from './common.ts';

type T = t.TestSuiteModel | t.TestModel;
type TResult = { suite: t.TestSuiteModel; isDefault: boolean };

/**
 * Arguments passed to the tree walking helper.
 */
export type ResultWalkDownArgs = {
  suite: t.TestSuiteRunResponse;
  test?: t.TestRunResponse;
  stop(): void;
};

/**
 * Arguments for finding a test suite.
 */
export type SuiteFindArgs = { suite: t.TestSuiteModel; test?: t.TestModel };

/**
 * Arguments for walking down a test tree.
 */
export type SuiteWalkDownArgs = { suite: t.TestSuiteModel; test?: t.TestModel; stop(): void };

/**
 * Arguments for walking up a test tree.
 */
export type SuiteWalkUpArgs = { suite: t.TestSuiteModel; isRoot: boolean; stop(): void };

/**
 * Takes a test suite model and transforms it into another
 * test runners format (e.g. Vitest, Mocha, etc).
 */
export type TestTransform = {
  /**
   * Transform a test-suite.
   */
  suite(input: t.TestSuiteModel | t.SpecImport): Promise<void>;
};

/**
 * Takes describe/it functions (from external test runners)
 * and produces an API for transforming suites.
 */
export type TestTransformCurry = (describe: unknown, it: unknown) => TestTransform;

/**
 * Helpers for calculating totals.
 */
export type TestTotalLib = {
  /**
   * Walk down a test-suite tree counting tests.
   */
  count(suite: t.TestSuiteModel): t.TestSuiteTotal;
};

/**
 * Helpers for walking a hierarchical tree of tests.
 */
export type TestTreeLib = {
  parent(child?: T): t.TestSuiteModel | undefined;
  root(child?: T): t.TestSuiteModel | undefined;
  walkDown(from: t.TestSuiteModel | undefined, handler: (e: t.SuiteWalkDownArgs) => void): void;
  walkUp(from: T | undefined, handler: (e: t.SuiteWalkUpArgs) => void): void;
  find(
    within: t.TestSuiteModel,
    match: (e: t.SuiteFindArgs) => boolean,
    options?: { limit?: number },
  ): t.SuiteFindArgs[];
  findOne(within: t.TestSuiteModel, match: (e: t.SuiteFindArgs) => boolean): t.SuiteFindArgs;
  siblings(item?: T): T[];
};

/**
 * Helpers for retrieving suite stats.
 */
export type TestStatsLib = {
  /**
   * Default empty stats.
   */
  readonly empty: t.TestSuiteRunStats;

  /**
   * Walk the given test-run results to calculate stats.
   */
  suite(results: t.TestSuiteRunResponse): t.TestSuiteRunStats;

  /**
   * Merge a list of results into a single stats object.
   */
  merge(input?: (t.TestSuiteRunStats | t.TestSuiteRunResponse)[]): t.TestSuiteRunStats;
};

/**
 * Helpers for walking a hierarchical tree of test results.
 */
export type TestResultTreeLib = {
  /**
   * Visit each test in the tree (descending).
   */
  walkDown(
    from: t.TestSuiteRunResponse | undefined,
    handler: (e: t.ResultWalkDownArgs) => void,
  ): void;

  /**
   * Determine if the given result tree does not contain any tests
   */
  isEmpty(from: t.TestSuiteRunResponse | undefined): boolean;
};

/**
 * Helpers for loading test suite modules.
 */
export type TestLoaderLib = {
  import(
    input: t.BundleImport | t.BundleImport[],
    options?: { init?: boolean },
  ): Promise<TResult[]>;
};

/**
 * Library of boolean flag helpers.
 */
export type TestIsLib = {
  promise: (typeof Is)['promise'];
  suiteId(input: unknown): boolean;
  testId(input: any): boolean;
  suite(input: any): input is t.TestSuiteModel;
  test(input: any): input is t.TestModel;
  testArgs(input: any): input is t.TestHandlerArgs;
  results(input: any): input is t.TestSuiteRunResponse;
};
