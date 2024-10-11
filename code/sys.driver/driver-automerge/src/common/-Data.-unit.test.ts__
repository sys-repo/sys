import { Store } from '../crdt/Store';
import { describe, expect, it } from '../test';
import { Data } from './Data';

describe('Data', () => {
  describe('Data.array', () => {
    type D = { items: number[] };
    const store = Store.init();
    const generator = store.doc.factory<D>((d) => (d.items = []));

    it('deleteAt', async () => {
      const doc = await generator();
      doc.change((d) => (d.items = [1, 2, 3, 4, 5]));

      const assertItems = (value: number[]) => {
        expect(doc.current.items).to.eql(value);
      };

      doc.change((d) => Data.array(d.items).deleteAt(-1));
      assertItems([2, 3, 4, 5]);

      doc.change((d) => Data.array(d.items).deleteAt(0));
      assertItems([3, 4, 5]);

      doc.change((d) => Data.array(d.items).deleteAt(1));
      assertItems([3, 5]);

      doc.change((d) => Data.array(d.items).deleteAt(0, 99));
      assertItems([]);
    });

    it('insertAt', async () => {
      const doc = await generator();
      doc.change((d) => (d.items = []));

      const assertItems = (value: number[]) => {
        expect(doc.current.items).to.eql(value);
      };

      doc.change((d) => Data.array(d.items).insertAt(0, 1));
      assertItems([1]);
      doc.change((d) => Data.array(d.items).insertAt(1, 2, 3));
      assertItems([1, 2, 3]);
      doc.change((d) => Data.array(d.items).insertAt(1, 99));
      assertItems([1, 99, 2, 3]);
    });

    it('throw: not an array', () => {
      [true, 123, '', {}, null, undefined].forEach((value: any) => {
        const fn = () => Data.array(value);
        expect(fn).to.throw(/Not an array/);
      });
    });

    it('throw: not an automerge array', () => {
      const fn = () => Data.array([1, 2, 3]);
      expect(fn).to.throw(/Not an automerge array/);
    });
  });

  describe('Data.assign (or delete) ← <undefined> not allowed on Automerge object', () => {
    type T = { msg?: string | null };

    it('assigns: string', () => {
      const obj: T = {};
      Data.assign(obj, 'msg', 'hello');
      expect(obj.msg).to.eql('hello');
    });

    it('assigns: null', () => {
      const obj: T = {};
      Data.assign(obj, 'msg', null);
      expect(obj.msg).to.eql(null);
    });

    it('assigns <undefined> ← field deleted', () => {
      const obj: T = {};
      Data.assign(obj, 'msg', 'hello');
      expect(obj.msg).to.eql('hello');

      Data.assign(obj, 'msg', undefined);
      expect('msg' in obj).to.eql(false); // NB: proves that "delete obj.msg" was used.
    });

    it('throw: not object', () => {
      [true, 123, '', [], null, undefined].forEach((value: any) => {
        const fn = () => Data.assign(value, 'msg', 'hello');
        expect(fn).to.throw(/Not an object/, String(value));
      });
    });
  });

  describe('Data.ensure', () => {
    type T = { item?: { count?: number } | number };

    it('assigns: string (simple type)', () => {
      const obj: T = {};
      Data.ensure(obj, 'item', 123);
      Data.ensure(obj, 'item', 456);
      expect(obj.item).to.eql(123);
    });

    it('asigns: object', () => {
      const obj: T = {};
      Data.ensure(obj, 'item', { count: 123 });
      Data.ensure(obj, 'item', { count: 456 });
      expect(obj.item).to.eql({ count: 123 });
    });

    it('throw: not object', () => {
      [true, 123, '', [], null, undefined].forEach((value: any) => {
        const fn = () => Data.ensure(value, 'msg', 'hello');
        expect(fn).to.throw(/Not an object/, String(value));
      });
    });
  });
});
