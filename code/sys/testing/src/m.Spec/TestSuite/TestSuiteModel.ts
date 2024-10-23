import { Constraints, Stats, TestTree } from '../TestSuite.helpers/mod.ts';
import { TestModel } from './TestModel.ts';
import { Progress } from './TestSuiteModel.Progress.ts';
import { DEFAULT, Delete, Hash, Time, slug, type t } from './common.ts';

type LazyParent = () => t.TestSuiteModel;

export const Def = {
  describe(modifier?: t.TestModifier, getParent?: LazyParent): t.TestSuiteDescribeDef {
    return (description, handler) => {
      const parent = getParent?.();
      const child = TestSuiteModel({ parent, description, handler, modifier });
      if (parent) parent.state.children = [...parent.state.children, child];
      return child;
    };
  },

  variants(getParent?: LazyParent): t.TestSuiteDescribe {
    const describe = Def.describe(undefined, getParent);
    (describe as any).skip = Def.describe('skip', getParent);
    (describe as any).only = Def.describe('only', getParent);
    return describe as t.TestSuiteDescribe;
  },
};

/**
 * A test suite model.
 */
export const TestSuiteModel = (args: {
  parent?: t.TestSuiteModel;
  description: string;
  handler?: t.TestSuiteHandler;
  modifier?: t.TestModifier;
}): t.TestSuiteModel => {
  const { parent, description } = args;
  const id = `TestSuite.${slug()}`;
  const hashCache = {
    sha1: '',
    sha256: '',
  };

  const init = async (suite: t.TestSuiteModel) => {
    const state = suite.state;
    if (!state.ready) {
      state.ready = true;
      await state.handler?.(suite);
      await Promise.all(state.children.map((child) => init(child))); // <== RECURSION 🌳
    }
    return suite;
  };

  type R = t.TestSuiteRunResponse;
  type O = t.TestSuiteRunOptions;
  const runSuite = (model: t.TestSuiteModel, options: O = {}) => {
    const { deep = true, ctx, noop, beforeEach, afterEach } = options;

    return new Promise<R>(async (resolve) => {
      const tx = `run.suite.tx.${slug()}`;
      const res: R = {
        id,
        tx,
        ok: true,
        description,
        time: { started: Time.now.timestamp, elapsed: -1 },
        tests: [],
        children: [],
        stats: Stats.empty,
        noop,
      };

      await init(model);
      const tests = model.state.tests;
      const childSuites = model.state.children;

      const progress = Progress(options.onProgress, { model, tx, beforeEach, afterEach });
      const before = progress.before;
      const after = progress.after;

      const getTimeout = () => options.timeout ?? model.state.timeout ?? DEFAULT.TIMEOUT;
      const timer = Time.timer();

      /**
       * Execute Tests.
       */
      progress.beforeAll();

      for (const test of tests) {
        if (options.only && !options.only.includes(test.id)) continue;
        const timeout = getTimeout();
        const excluded = Constraints.exclusionModifiers(test);
        res.tests.push(await test.run({ timeout, excluded, ctx, before, after, noop }));
      }

      /**
       * Execute child suites.
       */
      if (deep && childSuites.length > 0) {
        for (const childSuite of childSuites) {
          const timeout = childSuite.state.timeout ?? getTimeout();
          const result = await childSuite.run({
            ...options,
            timeout,
            onProgress: undefined, // NB: Child suites do not report progress (handled completely from root suite).
            beforeEach: before,
            afterEach: after,
          });
          res.children.push(result); // <== RECURSION 🌳
        }
      }

      /**
       * Done.
       */
      res.time.elapsed = timer.elapsed.msec;
      if (res.tests.some(({ error }) => Boolean(error))) res.ok = false;
      if (res.children.some(({ ok }) => !ok)) res.ok = false;
      res.stats = Stats.suite(res);

      // Finish up.
      progress.afterAll();
      resolve(Delete.undefined(res));
    });
  };

  const state: t.TestSuiteModelState = {
    parent,
    ready: false,
    modifier: args.modifier,
    description,
    tests: [],
    children: [],
    handler: args.handler,
  };

  /**
   * Define a child suite.
   */
  const describe = Def.variants(() => model);

  /**
   * Define a single test.
   */
  const testDef = (modifier?: t.TestModifier): t.TestSuiteItDef => {
    return (description, handler) => {
      const parent = model;
      const test = TestModel({ parent, description, handler, modifier });
      state.tests = [...state.tests, test];
      return test;
    };
  };

  const it = testDef();
  (it as any).skip = testDef('skip');
  (it as any).only = testDef('only');

  const model: t.TestSuiteModel = {
    kind: 'TestSuite',
    id,
    state,

    describe: describe as t.TestSuiteDescribe,
    it: it as t.TestSuiteIt,

    get ready() {
      return state.ready;
    },

    get description() {
      return state.description;
    },

    timeout(value) {
      state.timeout = Math.max(0, value);
      return model;
    },

    init: () => init(model),

    run(options) {
      return runSuite(model, options);
    },

    async merge(...suites) {
      // Clone the incoming suites.
      await init(model);
      suites = await Promise.all(suites.map((suite) => suite.clone()));

      // Merge into self.
      state.children = [...state.children, ...suites];
      state.children.forEach((suite) => (suite.state.parent = model));
      return model;
    },

    async clone() {
      const clone = TestSuiteModel({ ...args });
      await init(clone);
      return clone;
    },

    walk(handler) {
      TestTree.walkDown(model, handler);
    },

    hash(algo = 'SHA1') {
      if (hashCache.sha1 && algo === 'SHA1') return hashCache.sha1;
      if (hashCache.sha256 && algo === 'SHA256') return hashCache.sha256;

      const identity: string[] = [];
      TestTree.walkDown(model, (e) => {
        if (e.test) identity.push(`test:${e.test.description}`);
        if (!e.test) identity.push(`suite:${e.suite.description}`);
      });

      let hash = '';
      if (algo === 'SHA1') hash = Hash.sha1(identity);
      if (algo === 'SHA256') hash = Hash.sha256(identity);

      const res = `suite:${hash}`;
      if (model.ready) {
        // Cache result when fully initialized.
        if (algo === 'SHA1') hashCache.sha1 = res;
        if (algo === 'SHA256') hashCache.sha256 = res;
      }
      return res;
    },

    toString: () => state.description,
  };

  return model;
};
