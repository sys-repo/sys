import { describe, expect, it, type t } from '../../-test.ts';
import { Test } from '../mod.ts';
import { Stats } from './mod.ts';

describe('Stats', () => {
  const toResults = async (input: t.TestSuiteModel) => {
    await input.init();
    const results = await input.run();
    const stats = Stats.suite(results);
    return { results, stats };
  };

  it('Stats.empty', () => {
    const res1 = Stats.empty;
    const res2 = Stats.empty;
    expect(res1).to.eql(res2);
    expect(res1).to.not.equal(res2);
    expect(res1).to.eql({ total: 0, passed: 0, failed: 0, skipped: 0, only: 0 });
  });

  describe('Stats.suite', () => {
    it('empty', async () => {
      const root = Test.describe('root', () => {});

      const { results, stats } = await toResults(root);
      expect(results.stats).to.eql(stats);
      expect(stats.total).to.eql(0);
      expect(stats.passed).to.eql(0);
      expect(stats.failed).to.eql(0);
      expect(stats.skipped).to.eql(0);
      expect(stats.only).to.eql(0);
    });

    it('succeeded', async () => {
      const root = Test.describe('root', (e) => {
        e.it('foo', () => {});
      });

      const { results, stats } = await toResults(root);
      expect(results.stats).to.eql(stats);
      expect(stats.total).to.eql(1);
      expect(stats.passed).to.eql(1);
      expect(stats.failed).to.eql(0);
      expect(stats.skipped).to.eql(0);
      expect(stats.only).to.eql(0);
    });

    it('failures', async () => {
      const root = Test.describe('root', (e) => {
        e.it('good', () => {});
        e.describe('things', (e) => {
          e.it('foo', () => {
            expect(123).to.eql(456);
          });
        });
      });

      const { results, stats } = await toResults(root);
      expect(results.stats).to.eql(stats);
      expect(stats.total).to.eql(2);
      expect(stats.passed).to.eql(1);
      expect(stats.failed).to.eql(1);
      expect(stats.skipped).to.eql(0);
      expect(stats.only).to.eql(0);
    });

    it('skipped', async () => {
      const root = Test.describe('root', (e) => {
        e.it('good', () => {});
        e.describe('things', (e) => {
          e.it.skip('foo', () => {});
        });
      });

      const { results, stats } = await toResults(root);
      expect(results.stats).to.eql(stats);
      expect(stats.total).to.eql(2);
      expect(stats.passed).to.eql(1);
      expect(stats.failed).to.eql(0);
      expect(stats.skipped).to.eql(1);
      expect(stats.only).to.eql(0);
    });

    it('skipped (via it.only)', async () => {
      const root = Test.describe('root', (e) => {
        e.it('good', () => {});
        e.describe('things', (e) => {
          e.it.only('foo', () => {});
          e.it('bar', () => expect(123).to.eql(456)); // NB: Failing test not run.
          e.it.only('zoo', () => {});
        });
        e.it.skip('skipped', () => {});
      });

      const { results, stats } = await toResults(root);
      expect(results.stats).to.eql(stats);
      expect(stats.total).to.eql(5);
      expect(stats.passed).to.eql(2);
      expect(stats.failed).to.eql(0);
      expect(stats.skipped).to.eql(1);
      expect(stats.only).to.eql(2);
    });

    it('skipped (via describe.only)', async () => {
      const root = Test.describe('root', (e) => {
        e.it('one', () => {});
        e.describe.only('things', (e) => {
          e.it('foo', () => {});
          e.it.skip('bar', () => expect(123).to.eql(456)); // NB: Failing test not run.
          e.it('zoo', () => {});
        });
        e.it('two', () => {});
      });

      const { results, stats } = await toResults(root);
      expect(results.stats).to.eql(stats);
      expect(stats.total).to.eql(5);
      expect(stats.passed).to.eql(2);
      expect(stats.failed).to.eql(0);
      expect(stats.skipped).to.eql(1);
      expect(stats.only).to.eql(2);
    });
  });

  describe('merge', () => {
    const root = Test.describe('root', (e) => {
      e.it('one', () => {});
      e.describe.only('things', (e) => {
        e.it('foo', () => {});
        e.it.skip('bar', () => null);
        e.it('zoo', () => expect(123).to.eql(456));
      });
      e.it('two', () => {});
    });

    it('stats (list)', async () => {
      const { stats } = await toResults(root);
      const res = Stats.merge([stats, stats, stats]);
      expect(stats).to.eql({ total: 5, passed: 1, failed: 1, skipped: 1, only: 2 });
      expect(res).to.eql({ total: 15, passed: 3, failed: 3, skipped: 3, only: 6 });
    });

    it('stats (list)', async () => {
      const { stats, results } = await toResults(root);
      const res = Stats.merge([results, results, results]);
      expect(stats).to.eql({ total: 5, passed: 1, failed: 1, skipped: 1, only: 2 });
      expect(res).to.eql({ total: 15, passed: 3, failed: 3, skipped: 3, only: 6 });
    });

    it('empty []', () => {
      const res1 = Stats.merge();
      const res2 = Stats.merge([]);
      expect(res1).to.eql(Stats.empty);
      expect(res2).to.eql(Stats.empty);
    });
  });
});
