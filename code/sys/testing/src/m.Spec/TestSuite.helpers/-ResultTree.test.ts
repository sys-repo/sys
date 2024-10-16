import { describe, expect, it, type t } from '../../-test.ts';
import { Test } from '../mod.ts';
import { ResultTree } from './mod.ts';

describe('ResultTree', () => {
  describe('walkDown', () => {
    it('to bottom', async () => {
      const suite = Test.describe('root', (e) => {
        e.it('foo-1', () => {});
        e.describe('child', (e) => {
          e.it('foo-2', () => {});
        });
      });

      const results = await suite.run();
      const list: t.ResultWalkDownArgs[] = [];
      ResultTree.walkDown(results, (e) => list.push(e));

      expect(list.length).to.eql(4);
      expect(list[0].suite.description).to.eql('root');
      expect(list[0].test).to.eql(undefined);
      expect(list[3].test?.description).to.eql('foo-2');
    });

    it('stops', async () => {
      const suite = Test.describe('root', (e) => {
        e.it('foo-1', () => {});
        e.describe('child', (e) => {
          e.it('foo-2', () => {});
        });
      });

      const results = await suite.run();
      const list: t.ResultWalkDownArgs[] = [];
      ResultTree.walkDown(results, (e) => {
        list.push(e);
        if (e.test?.description === 'foo-1') e.stop();
      });

      expect(list.length).to.eql(2);
      expect(list[0].suite.description).to.eql('root');
      expect(list[1].test?.description).to.eql('foo-1');
    });
  });

  describe('isEmpty', () => {
    it('undefined (empty: true)', () => {
      const res = ResultTree.isEmpty(undefined);
      expect(res).to.eql(true);
    });

    it('not empty', async () => {
      const suite = Test.describe('root', (e) => {
        e.it.skip('foo-1', () => {});
        e.describe('child', (e) => {
          e.it('foo-2', () => {});
        });
      });
      const res = ResultTree.isEmpty(await suite.run());
      expect(res).to.eql(false);
    });

    it('empty: tests skipped', async () => {
      const suite = Test.describe('root', (e) => {
        e.it.skip('foo-1', () => {});
        e.describe('child', (e) => {
          e.it.skip('foo-2', () => {});
        });
      });
      const res = ResultTree.isEmpty(await suite.run());
      expect(res).to.eql(true);
    });

    it('empty: root skipped', async () => {
      const suite = Test.describe.skip('root', (e) => {
        e.it('foo-1', () => {});
        e.describe('child', (e) => {
          e.it('foo-2', () => {});
        });
      });

      const res = ResultTree.isEmpty(await suite.run());
      expect(res).to.eql(true);
    });

    it('not empty: descendent .only', async () => {
      const suite1 = Test.describe('root', (e) => {
        e.it('foo-1', () => {});
        e.describe.only('child', (e) => {
          e.it('foo-2', () => {});
        });
      });

      const suite2 = Test.describe('root', (e) => {
        e.it('foo-1', () => {});
        e.describe('child', (e) => {
          e.it.only('foo-2', () => {});
        });
      });

      const res1 = ResultTree.isEmpty(await suite1.run());
      const res2 = ResultTree.isEmpty(await suite2.run());

      expect(res1).to.eql(false);
      expect(res2).to.eql(false);
    });
  });
});
