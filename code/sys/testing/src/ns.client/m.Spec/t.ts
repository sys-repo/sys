import type { t } from './common.ts';
import type { Loader, Tree } from './TestSuite.helpers/mod.ts';
import type { Stats } from './TestSuite.helpers/Stats.ts';
import type { Total } from './TestSuite.helpers/Total.ts';
import type { Transform } from './TestSuite.helpers/Transform.ts';

export type * from './TestSuite.helpers/t.ts';

type Id = string;
type SuiteId = Id;
type TestId = Id;
type Anything = void | any;
type Milliseconds = number;
type Timestamp = number;
type Ctx = Record<string, unknown>;

/**
 * Modifiers that can be applied to a spec while testing.
 */
export type TestModifier = 'skip' | 'only';

/**
 * Various types of inputs that represent a Bundle of specs to import.
 */
export type BundleImport = TestSuiteModel | SpecImport | Promise<any>;

/**
 * A module that contains a DevHarness spec.
 */
export type SpecModule = { default: TestSuiteModel };

/**
 * A module import of a spec.
 */
export type SpecImport = t.ModuleImport<SpecModule>;

/**
 * A module importer function of a spec.
 */
export type SpecImporter = t.ModuleImporter<SpecModule>;

/**
 * A map of module DevHarness spec imports.
 */
export type SpecImports = t.ModuleImports<SpecModule>;

/**
 * BDD ("behavior driven develoment") style test configuration API.
 */
export type Test = {
  Is: t.TestIsLib;
  Tree: typeof Tree;
  Total: typeof Total;
  Stats: typeof Stats;
  describe: TestSuiteDescribe;

  import: typeof Loader.import;
  using: typeof Transform;

  bundle(items: BundleImport | BundleImport[]): Promise<TestSuiteModel>;
  bundle(description: string, items: BundleImport | BundleImport[]): Promise<TestSuiteModel>;

  run(items: BundleImport | BundleImport[]): Promise<TestSuiteRunResponse>;
  run(description: string, items: BundleImport | BundleImport[]): Promise<TestSuiteRunResponse>;
};

/**
 * A suite ("set") of tests.x
 */
export type TestSuite = {
  id: SuiteId;
  timeout(value: Milliseconds): TestSuite;
  describe: TestSuiteDescribe;
  it: TestSuiteIt;
};

export type TestSuiteDescribe = TestSuiteDescribeDef & {
  skip: TestSuiteDescribeDef;
  only: TestSuiteDescribeDef;
};
export type TestSuiteDescribeDef = (
  description: string,
  handler?: TestSuiteHandler,
) => TestSuiteModel;

export type TestSuiteIt = TestSuiteItDef & { skip: TestSuiteItDef; only: TestSuiteItDef };
export type TestSuiteItDef = (description: string, handler?: TestHandler) => TestModel;

/**
 * A handler that contains a "suite" of tests, or child suites.
 */
export type TestSuiteHandler = (e: TestSuite) => Anything | Promise<Anything>;

/**
 * The handler that contains the body of a test.
 */
export type TestHandler = (e: TestHandlerArgs) => Anything | Promise<Anything>;

/**
 * Arguments passed to the TestHandler.
 */
export type TestHandlerArgs = {
  id: TestId;
  description: string;
  timeout(value: Milliseconds): TestHandlerArgs;
  ctx?: Ctx;
};

/**
 * Model: Test
 */
export type TestModel = {
  kind: 'Test';
  parent: TestSuiteModel;
  id: TestId;
  run: TestRun;
  description: string;
  handler?: TestHandler;
  modifier?: TestModifier;
  clone(): TestModel;
  toString(): string;
};

/**
 * Function that runs a single test.
 */
export type TestRun = (options?: TestRunOptions) => Promise<TestRunResponse>;

/**
 * Options passed to TestRun.
 */
export type TestRunOptions = {
  timeout?: Milliseconds;
  excluded?: TestModifier[];
  ctx?: Ctx;
  before?: BeforeRunTest;
  after?: AfterRunTest;
  noop?: boolean; // Produces a result without executing any of the actual test function.
};

/**
 * Response returned after a single test run has completed.
 */
export type TestRunResponse = {
  id: TestId;
  tx: Id; // Unique ID for the individual test run operation.
  ok: boolean;
  description: string;
  time: { started: Timestamp; elapsed: Milliseconds };
  timeout: Milliseconds;
  excluded?: TestModifier[];
  error?: Error;
  noop?: boolean;
};

/**
 * Model: Test Suite
 */
export type TestSuiteModel = TestSuite & {
  readonly kind: 'TestSuite';
  readonly state: TestSuiteModelState;
  readonly description: string;
  readonly ready: boolean; // true after [init] has been run.
  run: TestSuiteRun;
  merge(...suites: TestSuiteModel[]): Promise<TestSuiteModel>;
  init(): Promise<TestSuiteModel>;
  clone(): Promise<TestSuiteModel>;
  walk(handler: (e: t.SuiteWalkDownArgs) => void): void;
  hash(algo?: 'SHA1' | 'SHA256'): string;
  toString(): string;
};

/**
 * State of a test/suite model.
 */
export type TestSuiteModelState = {
  parent?: TestSuiteModel;
  ready: boolean; // true after [init] has been run.
  description: string;
  handler?: TestSuiteHandler;
  tests: TestModel[];
  children: TestSuiteModel[];
  timeout?: Milliseconds;
  modifier?: TestModifier;
};

/**
 * Function that runs a suite.
 */
export type TestSuiteRun = (options?: TestSuiteRunOptions) => Promise<TestSuiteRunResponse>;

/**
 * Options passed to the `TestSuiteRun`.
 */
export type TestSuiteRunOptions = {
  timeout?: number;
  deep?: boolean;
  ctx?: Ctx;
  only?: TestModel['id'][]; // Override: a set of spec IDs to filter on, excluding all others.
  beforeEach?: BeforeRunTest;
  afterEach?: AfterRunTest;
  onProgress?: SuiteRunProgress;
  noop?: boolean; // Produces a result-tree without executing any of the actual test functions.
};

/**
 * Response returned after a suite has completed it's run.
 */
export type TestSuiteRunResponse = {
  id: SuiteId;
  tx: Id; // Unique ID for the individual suite run operation.
  ok: boolean;
  description: string;
  time: { started: Timestamp; elapsed: Milliseconds };
  tests: TestRunResponse[];
  children: TestSuiteRunResponse[];
  stats: TestSuiteRunStats;
  noop?: boolean;
};

export type TestSuiteRunStats = {
  total: number; // The total number of tests that ran.
  passed: number;
  failed: number;
  skipped: number;
  only: number;
};

export type TestSuiteTotal = {
  total: number;
  runnable: number; // NB: Total runnable tests, excluding skipped tests
  skipped: number;
  only: number;
};

/**
 * Handler that run before a test is run.
 */
export type BeforeRunTest = (e: BeforeRunTestArgs) => t.IgnoredResult;

/**
 * Arguments passed to the BeforeRun handler.
 */
export type BeforeRunTestArgs = {
  id: TestId;
  description: string;
};

/**
 * Handler that run after a test is run.
 */
export type AfterRunTest = (e: AfterRunTestArgs) => t.IgnoredResult;

/**
 * Arguments passed to the AfterRun handler.
 */
export type AfterRunTestArgs = {
  id: TestId;
  description: string;
  result: t.TestRunResponse;
};

/**
 * Handlers that report progress during a run operation.
 */
export type SuiteRunProgress = (e: SuiteRunProgressArgs) => void;

/**
 * Arguments passed to `SuiteRunProgress`.
 */
export type SuiteRunProgressArgs =
  | SuiteRunProgressStart
  | SuiteRunProgressBeforeTest
  | SuiteRunProgressAfterTest
  | SuiteRunProgressComplete;

type TestSuiteRunCommon = {
  id: { suite: SuiteId; tx: Id };
  progress: { percent: number; total: number; completed: number };
  total: t.TestSuiteTotal;
  elapsed: Milliseconds;
};

/**
 * Progress at the start of a suite run.
 */
export type SuiteRunProgressStart = TestSuiteRunCommon & {
  op: 'run:suite:start';
};

/**
 * progress at the point just before a test is run.
 */
export type SuiteRunProgressBeforeTest = TestSuiteRunCommon & {
  op: 'run:test:before';
  description: string;
};

/**
 * Progress after a test has run.
 */
export type SuiteRunProgressAfterTest = TestSuiteRunCommon & {
  op: 'run:test:after';
  description: string;
  result: t.TestRunResponse;
};

/**
 * Progress at the moment of completion.
 */
export type SuiteRunProgressComplete = TestSuiteRunCommon & {
  op: 'run:suite:complete';
};
