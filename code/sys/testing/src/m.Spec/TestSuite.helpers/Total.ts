import type { t } from './common.ts';
import { Constraints } from './Constraints.ts';
import { TestTree } from './TestTree.ts';

/**
 * Helpers for calculating totals.
 */
export const Total: t.TestTotalLib = {
  count(suite: t.TestSuiteModel) {
    const res: t.TestSuiteTotal = {
      total: 0,
      runnable: 0,
      skipped: 0,
      only: 0,
    };

    TestTree.walkDown(suite, (e) => {
      if (e.test) {
        const exclusions = Constraints.exclusionModifiers(e.test);
        const isExcluded = exclusions.length > 0;
        const isOnly = Constraints.isWithinOnlySet(e.test);
        const isSkipped = Constraints.isSkipped(e.test);

        res.total++;
        if (isOnly) res.only++;
        if (isSkipped) res.skipped++;
        if (!isExcluded) res.runnable++;
      }
    });
    return res;
  },
};
