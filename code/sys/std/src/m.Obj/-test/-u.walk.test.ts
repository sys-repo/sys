import { describe, expect, it } from '../../-test.ts';
import { Obj } from '../mod.ts';

describe('Obj.walk', () => {
  type T = { key: string | number; value: any; path: (string | number)[] };

  it('processes object', () => {
    const walked: T[] = [];
    const input = {
      name: 'foo',
      count: 123,
      child: { enabled: true, list: [1, 2] },
    };

    Obj.walk(input, ({ key, value, path }) => walked.push({ key, value, path }));

    expect(walked).to.eql([
      { key: 'name', value: 'foo', path: ['name'] },
      { key: 'count', value: 123, path: ['count'] },
      { key: 'child', value: { enabled: true, list: [1, 2] }, path: ['child'] },
      { key: 'enabled', value: true, path: ['child', 'enabled'] },
      { key: 'list', value: [1, 2], path: ['child', 'list'] },
      { key: 0, value: 1, path: ['child', 'list', 0] },
      { key: 1, value: 2, path: ['child', 'list', 1] },
    ]);
  });

  it('passes parent in callback', () => {
    const root = { child: { enabled: true, list: [1, 2] } };
    const parents: any[] = [];
    Obj.walk(root, (e) => parents.push(e.parent));
    expect(parents.length).to.eql(5);
    expect(parents[0]).to.eql(root);
    expect(parents[1]).to.eql(root.child);
    expect(parents[2]).to.eql(root.child);
    expect(parents[3]).to.eql(root.child.list);
    expect(parents[4]).to.eql(root.child.list);
  });

  it('processes array', () => {
    const walked: T[] = [];
    const input = ['foo', 123, { enabled: true, list: [1, 2] }];

    Obj.walk(input, ({ key, value, path }) => walked.push({ key, value, path }));

    expect(walked).to.eql([
      { key: 0, value: 'foo', path: [0] },
      { key: 1, value: 123, path: [1] },
      { key: 2, value: { enabled: true, list: [1, 2] }, path: [2] },
      { key: 'enabled', value: true, path: [2, 'enabled'] },
      { key: 'list', value: [1, 2], path: [2, 'list'] },
      { key: 0, value: 1, path: [2, 'list', 0] },
      { key: 1, value: 2, path: [2, 'list', 1] },
    ]);
  });

  it('processes nothing (non-object / array)', () => {
    const test = (input: any) => {
      const walked: any[] = [];
      Obj.walk(input, (e) => walked.push(e));
      expect(walked).to.eql([]); // NB: nothing walked.
    };
    [0, true, '', null, undefined].forEach((input) => test(input));
  });

  it('stops midway', () => {
    const walked: T[] = [];
    const input = {
      name: 'foo',
      child: { enabled: true, list: [1, 2] },
    };

    Obj.walk(input, (e) => {
      const { key, value, path } = e;
      if (value === true) return e.stop();
      walked.push({ key, value, path });
    });

    expect(walked).to.eql([
      { key: 'name', value: 'foo', path: ['name'] },
      { key: 'child', value: { enabled: true, list: [1, 2] }, path: ['child'] },
    ]);
  });

  it('mutates key/value', () => {
    const root = { child: { enabled: true, list: [1, 2] } };
    Obj.walk(root, (e) => {
      if (e.key === 'enabled') e.mutate(false);
      if (e.key === 0) e.mutate('hello');
    });
    expect(root.child.enabled).to.eql(false);
    expect(root.child.list[0]).to.eql('hello');
  });

  describe('circular reference', () => {
    it('walks without error: {object}', () => {
      const a = { b: null as any };
      const b = { a, child: [1, { msg: 'hello' }] };
      a.b = b;

      let count = 0;
      Obj.walk(a, () => count++);
      expect(count).to.eql(7);
    });

    it('walks without error: [array]', () => {
      const a: any[] = [0];
      const b: any[] = [a];
      b.push(b);
      a.push(b);

      let count = 0;
      Obj.walk(a, () => count++);
      expect(count).to.eql(6);
    });

    it('multiple fields with same value (NB: not short-circuited by circular reference check)', () => {
      const test = (obj: any, expectKeys?: string[]) => {
        const keys: string[] = [];
        Obj.walk(obj, (e) => keys.push(String(e.key)));
        if (expectKeys) expect(keys).to.eql(expectKeys);
        return keys;
      };

      const a: any = {};
      const b: any = {};
      a.b = b;
      b.a = a;
      const obj1 = { strings: { foo: 'hello', bar: 'hello' } };
      const obj2 = { foo: a, bar: a };

      test(obj1, ['strings', 'foo', 'bar']);
      test(obj2, ['foo', 'b', 'a', 'bar']);
    });
  });
});
