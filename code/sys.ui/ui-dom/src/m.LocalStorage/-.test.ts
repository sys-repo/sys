import { describe, DomMock, expect, it, slug } from '../-test.ts';
import { LocalStorage } from './mod.ts';

describe('LocalStorage', { sanitizeOps: false, sanitizeResources: false }, () => {
  it('(setup)', () => DomMock.polyfill());

  describe('ns', () => {
    type T = { count: number; msg?: string };
    const prefix = `test-${slug()}`;

    it('cleans prefix', () => {
      const ns = LocalStorage.ns<T>('foo/bar////');
      console.log('ns', ns);
      expect(ns.namespace).to.eql('foo/bar');
    });

    it('set/get', () => {
      const ns = LocalStorage.ns<T>(prefix);
      const local = ns.object({ count: 0 });
      expect(local.count).to.eql(0);
      expect(local.msg).to.eql(undefined);

      local.count = 456;
      local.msg = 'hello';

      expect(local.count).to.eql(456);
      expect(local.msg).to.eql('hello');
    });
  });
});
