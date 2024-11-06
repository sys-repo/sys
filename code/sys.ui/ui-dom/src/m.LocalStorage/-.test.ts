import { describe, expect, it, slug } from '../-test.ts';
import { Mock } from '../m.Mock/mod.ts';
import { LocalStorage } from './mod.ts';

describe(
  'LocalStorage',

  /**
   * NOTE: leaked timers left around by the "happy-dom" module.
   */
  { sanitizeOps: false, sanitizeResources: false },

  () => {
    type T = { count: number; msg?: string };
    it('(setup)', () => Mock.polyfill());

    const prefix = `test-${slug()}`;
    const localstore = LocalStorage<T>(prefix);

    it('set/get', () => {
      const local = localstore.object({ count: 0 });
      expect(local.count).to.eql(0);
      expect(local.msg).to.eql(undefined);

      local.count = 456;
      local.msg = 'hello';

      expect(local.count).to.eql(456);
      expect(local.msg).to.eql('hello');
    });
  },
);
