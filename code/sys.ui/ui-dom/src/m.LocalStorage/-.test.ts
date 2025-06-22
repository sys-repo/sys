import { c, describe, DomMock, expect, it, slug } from '../-test.ts';
import { LocalStorage } from './mod.ts';

describe('LocalStorage', { sanitizeOps: false, sanitizeResources: false }, () => {
  it('(setup)', () => DomMock.polyfill());

  describe('ns', () => {
    type T = { count: number; msg?: string };
    const prefix = `test-${slug()}`;

    it('cleans prefix', () => {
      const ns = LocalStorage.ns<T>('foo/bar////');
      console.info(c.bold(c.cyan('\nLocalStorage.ns<T>:\n')), ns, '\n');
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
      console.info(c.bold(c.cyan('\nLocalStorage.immutable<T>:\n')), state, '\n');

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

    it('create → reset (to defaults)', () => {
      type T = { count: number; msg?: string };
      const initial: T = { count: 0 };
      const key = `test-${slug()}`;
      const store = LocalStorage.immutable<T>(key, initial);

      let fired = 0;
      store.events().$.subscribe(() => fired++);

      expect(store.current).to.eql({ count: 0 });
      store.change((d) => {
        d.count = 1234;
        d.msg = 'hello-👋';
      });
      expect(store.current).to.eql({ count: 1234, msg: 'hello-👋' });

      // Reset (prior initial):
      fired = 0;
      store.reset();
      expect(fired).to.eql(1);
      expect(store.current).to.eql(initial);
      expectJsonSaved(key, store.current);

      // Reset (new initial):
      const updated: T = { count: 123 };
      store.reset(updated);
      expect(store.current).to.eql(updated);
      expectJsonSaved(key, store.current);

      store.change((d) => (d.count = 888));
      store.reset(); // NB: the new initial value is used.
      expect(store.current).to.eql(updated);
      expectJsonSaved(key, store.current);
    });

    it('multi-instance (singleton)', () => {
      const initial: T = { count: 0 };
      const key = `test-${slug()}`;
      const a = LocalStorage.immutable(key, initial);
      const b = LocalStorage.immutable(key, initial);
      const c = LocalStorage.immutable(`test-${slug()}`, initial);

      expect(a).to.equal(b);
      expect(a).to.not.equal(c);

      expect(a.current).to.eql(initial);
      expect(a.current).to.eql(b.current);

      a.change((d) => (d.count = 1234));
      expect(a.current.count).to.eql(1234);
      expect(a.current).to.eql(b.current);
    });
  });
});
