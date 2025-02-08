import type { t } from './common.ts';

/**
 * Helpers for walking a hierarchical tree of test results.
 */
export const ResultTree: t.TestResultTreeLib = {
  /**
   * Visit each test in the tree (descending).
   */
  walkDown(from: t.TestSuiteRunResponse | undefined, handler: (e: t.ResultWalkDownArgs) => void) {
    if (!from) return;

    const invoke = (suite: t.TestSuiteRunResponse, test?: t.TestRunResponse) => {
      let stop = false;
      handler({ suite, test, stop: () => (stop = true) });
      return { stop };
    };

    // Visit the suite.
    if (invoke(from).stop) return; // NB: Exit requested.

    // Visit each test.
    for (const test of from.tests) {
      if (invoke(from, test).stop) return; // NB: Exit requested.
    }

    // Walk down into child suites.
    from.children.forEach((child) => ResultTree.walkDown(child, handler)); // <== RECURSION 🌳
  },

  /**
   * Determine if the given result tree does not contain any tests
   */
  isEmpty(from: t.TestSuiteRunResponse | undefined) {
    if (!from) return true;

    let _result = true;
    ResultTree.walkDown(from, (e) => {
      if (e.test && !e.test.excluded) {
        _result = false;
        e.stop();
      }
    });

    return _result;
  },
};
