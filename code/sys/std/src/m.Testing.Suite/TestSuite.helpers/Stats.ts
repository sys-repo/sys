import type { t } from './common.ts';
import { Tree } from './Tree.ts';
import { Is } from './Is.ts';

export const Stats = {
  /**
   * Default empty stats.
   */
  get empty(): t.TestSuiteRunStats {
    return { total: 0, passed: 0, failed: 0, skipped: 0, only: 0 };
  },

  /**
   * Walk the given test-run results to calculate stats.
   */
  suite(results: t.TestSuiteRunResponse): t.TestSuiteRunStats {
    const res = Stats.empty;
    if (Tree.Results.isEmpty(results)) return res;

    Tree.Results.walkDown(results, (e) => {
      if (!e.test) return;

      const excluded = e.test.excluded ?? [];
      const skipped = excluded.includes('skip');
      const only = !skipped && excluded.includes('only');

      res.total++;
      if (e.test.ok && !skipped && !only) res.passed++;
      if (!e.test.ok) res.failed++;
      if (skipped) res.skipped++;
      if (only) res.only++;
    });

    return res;
  },

  /**
   * Merge a list of results into a single stats object.
   */
  merge(input: (t.TestSuiteRunStats | t.TestSuiteRunResponse)[] = []): t.TestSuiteRunStats {
    const list = input.map((item) => (Is.results(item) ? item.stats : item));
    const res: t.TestSuiteRunStats = Stats.empty;

    list.forEach((item) => {
      res.total += item.total;
      res.passed += item.passed;
      res.failed += item.failed;
      res.skipped += item.skipped;
      res.only += item.only;
    });

    return res;
  },
};
