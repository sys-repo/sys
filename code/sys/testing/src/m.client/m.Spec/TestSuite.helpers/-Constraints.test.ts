import { Constraints, TestTree } from './mod.ts';
import { Test } from '../mod.ts';
import { describe, expect, it, type t } from '../../-test.ts';

type T = t.TestSuiteModel | t.TestModel;

describe('Test Constraints (".skip", ".only")', () => {
  const map = {
    descriptions(list: T[]) {
      return list.map((item) => (item.kind === 'Test' ? item.description : item.state.description));
    },
  };

  const findSuite = (root: t.TestSuiteModel, description: string) =>
    TestTree.findOne(root, (e) => e.suite.toString() === description).suite;

  const findTest = (root: t.TestSuiteModel, description: string) =>
    TestTree.findOne(root, (e) => e.test?.toString() === description).test;

  describe('Constraints.scan', () => {
    it('none', async () => {
      const root = await Test.describe('root', (e) => {
        e.it('1', () => null);
        e.describe('2', (e) => {
          e.it('2.1', () => null);
          e.describe('2.2', (e) => e.it('2.2.1'));
        });
      }).init();

      expect(Constraints.scan(root, 'only')).to.eql([]);
      expect(Constraints.scan(root, 'skip')).to.eql([]);
      expect(Constraints.scan(root, ['skip', 'only'])).to.eql([]);
      expect(Constraints.scan(root, [])).to.eql([]);
    });

    it('root', async () => {
      const root = await Test.describe
        .only('root', (e) => {
          e.it('1', () => null);
          e.describe('2', (e) => e.it('2.1', () => null));
        })
        .init();

      const res1 = Constraints.scan(root, 'only');
      const res2 = Constraints.scan(root, 'skip');

      expect(map.descriptions(res1)).to.eql(['root']);
      expect(map.descriptions(res2)).to.eql([]);
    });

    it('some', async () => {
      const root = await Test.describe('root', (e) => {
        e.it('1', () => null);
        e.describe.only('2', (e) => {
          e.it.only('2.1', () => null);
          e.describe('2.2', () => e.it.skip('2.2.1'));
        });
        e.it.only('3', () => null);
      }).init();

      const res1 = Constraints.scan(root, 'only');
      const res2 = Constraints.scan(root, 'skip');
      const res3 = Constraints.scan(root, ['skip', 'only']);

      expect(map.descriptions(res1)).to.eql(['3', '2', '2.1']);
      expect(map.descriptions(res2)).to.eql(['2.2.1']);
      expect(map.descriptions(res3)).to.eql(['3', '2', '2.1', '2.2.1']);
    });
  });

  describe('Contraints.isSkipped', () => {
    it('not skipped', async () => {
      const root = await Test.describe('root', (e) => {
        e.it('1', () => null);
        e.describe('2', (e) => {
          e.it.only('2.1', () => null);
          e.describe('2.2', () => e.it('2.2.1'));
        });
        e.it.only('3', () => null);
      }).init();

      expect(Constraints.isSkipped(undefined)).to.eql(false);
      expect(Constraints.isSkipped(root)).to.eql(false);
      expect(Constraints.isSkipped(findTest(root, '1'))).to.eql(false);
      expect(Constraints.isSkipped(findSuite(root, '2'))).to.eql(false);
      expect(Constraints.isSkipped(findTest(root, '2.2.1'))).to.eql(false);
    });

    it('is skipped', async () => {
      const root = await Test.describe('root', (e) => {
        e.it('1', () => null);
        e.describe.skip('2', (e) => {
          e.it.only('2.1', () => null); // NB: inherited "skip"
          e.describe('2.2', () => e.it('2.2.1')); // NB: inherited "skip"
        });
        e.it.skip('3', () => null);
      }).init();

      expect(Constraints.isSkipped(root)).to.eql(false);
      expect(Constraints.isSkipped(findSuite(root, '2'))).to.eql(true);
      expect(Constraints.isSkipped(findTest(root, '2.2.1'))).to.eql(true); // NB: inherited "skip"
      expect(Constraints.isSkipped(findTest(root, '2.1'))).to.eql(true); // NB: inherited "skip"
      expect(Constraints.isSkipped(findTest(root, '3'))).to.eql(true);
    });
  });

  describe('Constraints.isWithinOnlySet', () => {
    it('none', async () => {
      const root = await Test.describe('root', (e) => {
        e.it('1', () => null);
        e.describe('2', (e) => {
          e.it.skip('2.1', () => null);
          e.describe('2.2', () => e.it('2.2.1'));
        });
        e.it.only('3', () => null);
      }).init();

      expect(Constraints.isWithinOnlySet(undefined)).to.eql(false);
      expect(Constraints.isWithinOnlySet(root)).to.eql(false);
      expect(Constraints.isWithinOnlySet(findTest(root, '1'))).to.eql(false);
      expect(Constraints.isWithinOnlySet(findSuite(root, '2'))).to.eql(false);
      expect(Constraints.isWithinOnlySet(findTest(root, '2.2.1'))).to.eql(false);
    });

    it('directly on test', async () => {
      const root = await Test.describe('root', (e) => {
        e.it.only('1', () => null);
        e.describe.skip('2', (e) => {
          e.describe('2.1', (e) => {
            e.it('2.1.1', () => null);
            e.it.only('2.1.2', () => null); // Excluded because of inherited "skip"
          });
        });
      }).init();

      expect(Constraints.isWithinOnlySet(root)).to.eql(false);
      expect(Constraints.isWithinOnlySet(findTest(root, '1'))).to.eql(true);
      expect(Constraints.isWithinOnlySet(findSuite(root, '2'))).to.eql(false);
      expect(Constraints.isWithinOnlySet(findTest(root, '2.1.1'))).to.eql(false);
      expect(Constraints.isWithinOnlySet(findTest(root, '2.1.2'))).to.eql(false); // Excluded because of inherited "skip"
    });

    it('inherited from parent suite', async () => {
      const root = await Test.describe('root', (e) => {
        e.it('1', () => null);
        e.describe.only('2', (e) => {
          e.it('2.1', () => null);
          e.describe('2.2', (e) => {
            e.it('2.2.1', () => null);
            e.it.skip('2.2.2', () => null); // Excluded because of inherited "skip"
          });
        });
      }).init();

      expect(Constraints.isWithinOnlySet(root)).to.eql(false);
      expect(Constraints.isWithinOnlySet(findTest(root, '1'))).to.eql(false);
      expect(Constraints.isWithinOnlySet(findSuite(root, '2'))).to.eql(true);
      expect(Constraints.isWithinOnlySet(findTest(root, '2.1'))).to.eql(true); // NB: Inherited.

      expect(Constraints.isWithinOnlySet(findSuite(root, '2.2'))).to.eql(true); // NB: Inherited.
      expect(Constraints.isWithinOnlySet(findTest(root, '2.2.1'))).to.eql(true); // NB: Inherited.
      expect(Constraints.isWithinOnlySet(findTest(root, '2.2.2'))).to.eql(false); // NB: Inherited but skipped.
    });

    it('inherited from parent suite, but excluded due to sibling', async () => {
      const root = await Test.describe('root', (e) => {
        e.it('1', () => null);
        e.describe.only('2', (e) => {
          e.it.only('2.1', () => null);
          e.describe('2.2', (e) => {
            e.it('2.2.1', () => null);
            e.it('2.2.2', () => null);
          });
          e.it('2.3', () => null);
        });
      }).init();

      expect(Constraints.isWithinOnlySet(root)).to.eql(false);
      expect(Constraints.isWithinOnlySet(findTest(root, '1'))).to.eql(false);
      expect(Constraints.isWithinOnlySet(findSuite(root, '2'))).to.eql(true);

      expect(Constraints.isWithinOnlySet(findTest(root, '2.1'))).to.eql(true);
      expect(Constraints.isWithinOnlySet(findSuite(root, '2.2'))).to.eql(false); // NB: because sibling
      expect(Constraints.isWithinOnlySet(findTest(root, '2.3'))).to.eql(false);

      Constraints.isWithinOnlySet(findTest(root, '2.2.1'));

      expect(Constraints.isWithinOnlySet(findTest(root, '2.2.1'))).to.eql(false);
      expect(Constraints.isWithinOnlySet(findTest(root, '2.2.2'))).to.eql(false);
    });
  });
});
