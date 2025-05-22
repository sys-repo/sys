import { describe, DomMock, expect, it, rx, slug } from '../-test.ts';
import { LocalStorage } from './mod.ts';

describe('LocalStorage', { sanitizeOps: false, sanitizeResources: false }, () => {
  it('(setup)', () => DomMock.polyfill());

  describe('ns', () => {
    type T = { count: number; msg?: string };
    const prefix = `test-${slug()}`;

    it('cleans prefix', () => {
      const ns = LocalStorage.ns<T>('foo/bar////');
      console.info('LocalStorage.ns<T>:\n', ns);
      expect(ns.namespace).to.eql('foo/bar');
    });

    it('object: set/get', () => {
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

  describe('Immutable<T>', () => {
    type T = { count: number; msg?: string };

    const expectJsonSaved = (key: string, value: T) => {
      expect(localStorage.getItem(key)).to.eql(JSON.stringify(value));
    };

    it('create → change → (saved)', () => {
      const key = `test-${slug()}`;
      const expectSaved = (value: T) => expectJsonSaved(key, value);

      // Create:
      expect(localStorage.getItem(key)).to.eql(null);
      const initial: T = { count: 0 };
      const state = LocalStorage.immutable(key, initial);
      expect(state.current).to.eql(initial);
      expectSaved(initial);

      // Change:
      state.change((d) => d.count++);
      expectSaved({ count: 1 });
      expect(state.current).to.eql({ count: 1 });

      state.change((d) => (d.msg = '👋'));
      expectSaved({ count: 1, msg: '👋' });
      expect(state.current).to.eql({ count: 1, msg: '👋' });
    });

    it('create → existing "undefined" value (unparsable JSON, does not fail)', () => {
      const key = `test-${slug()}`;
      localStorage.setItem(key, 'undefined');

      const a = LocalStorage.immutable(key, { count: 123 });
      expect(a.current).to.eql({ count: 123 });

      const b = LocalStorage.immutable(key, { count: 0 });
      expect(b.current).to.eql({ count: 123 });
    });

    it('dispose$', () => {
      const life = rx.lifecycle();
      const key = `test-${slug()}`;
      const expectSaved = (value: T) => expectJsonSaved(key, value);

      const state = LocalStorage.immutable(key, { count: 123 }, life.dispose$);
      expectSaved({ count: 123 });
      state.change((d) => (d.count = 888));
      expectSaved({ count: 888 });

      life.dispose();
      state.change((d) => (d.count += 1));
      expectSaved({ count: 888 });
    });
  });
});
