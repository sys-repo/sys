import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Obj } from '../mod.ts';

describe('Obj.truncateStrings', () => {
  it('shallow', () => {
    const name = 'foo'.repeat(100);
    const obj = {
      name,
      count: 123,
      obj: {},
      list: [],
      bool: true,
      undef: undefined,
      nil: null,
    };

    const a = Obj.truncateStrings(obj);
    const b = Obj.truncateStrings(obj, { mutate: true });

    const expected = {
      ...obj,
      name: `${name.substring(0, 35)}...`,
    };

    expect(a).to.eql(expected);
    expect(b).to.eql(expected);
    expect(a).to.not.equal(obj);
    expect(b).to.equal(obj);
  });

  it('deep', () => {
    const name = 'foo'.repeat(50);
    const obj = {
      name,
      child: {
        child: {
          name,
          count: 123,
          obj: {},
          list: [],
          bool: true,
          undef: undefined,
          nil: null,
        },
      },
    };

    const res = Obj.truncateStrings(obj);

    expect(res).to.eql({
      name: `${name.substring(0, 35)}...`,
      child: {
        child: {
          ...obj.child.child,
          name: `${name.substring(0, 35)}...`,
        },
      },
    });
  });

  it('maxDepth: 0 → root only', () => {
    const name = 'foo'.repeat(20);
    const obj = {
      name,
      child: { name, child: { name } },
    };

    const res = Obj.truncateStrings(obj, {
      maxDepth: 0,
      maxLength: 10,
      ellipsis: false,
    });

    expect(res).to.eql({
      name: name.substring(0, 10),
      child: {
        name,
        child: { name },
      },
    });
  });

  it('maxDepth: 1 → root + first level', () => {
    const name = 'foo'.repeat(20);
    const obj = {
      name,
      child: {
        name,
        child: { name },
      },
    };

    const res = Obj.truncateStrings(obj, {
      maxDepth: 1,
      maxLength: 8,
      ellipsis: true,
    });

    expect(res).to.eql({
      name: `${name.substring(0, 8)}...`,
      child: {
        name: `${name.substring(0, 8)}...`,
        child: { name },
      },
    });
  });

  it('maxDepth: 2 → root + two levels deep', () => {
    const name = 'foo'.repeat(20);
    const obj = {
      name,
      child: {
        name,
        child: {
          name,
          child: { name },
        },
      },
    };

    const res = Obj.truncateStrings(obj, {
      maxDepth: 2,
      maxLength: 6,
      ellipsis: false,
    });

    const truncated = name.substring(0, 6);

    expect(res).to.eql({
      name: truncated,
      child: {
        name: truncated,
        child: {
          name: truncated,
          child: { name },
        },
      },
    });
  });

  it('options: no ellipsis, maxLength', () => {
    const name = 'foo'.repeat(100);
    const obj = { name };

    const a = Obj.truncateStrings(obj, {});
    const b = Obj.truncateStrings(obj, { ellipsis: false, maxLength: 10 });
    const c = Obj.truncateStrings(obj, 10);

    expect(a.name).to.eql(`${name.substring(0, 35)}...`);
    expect(b.name).to.eql(name.substring(0, 10));
    expect(c.name).to.eql(`${name.substring(0, 10)}...`);
  });

  it('<undefined> object with options', () => {
    expect(Obj.truncateStrings(undefined, 10)).to.eql(undefined);
    expect(Obj.truncateStrings(undefined, { maxLength: 5, ellipsis: false })).to.eql(undefined);
  });

  it('defined object returns T (not T | undefined)', () => {
    const input = { name: 'x' } as const;
    const out = Obj.truncateStrings(input);
    expectTypeOf(out).toEqualTypeOf<typeof input>();
    expect(out).to.eql(input);
  });

  it('mutate: true returns same instance', () => {
    const obj = { name: 'x'.repeat(100) };
    const out = Obj.truncateStrings(obj, { mutate: true, maxLength: 10 });
    expect(out).to.equal(obj);
    expect(obj.name).to.eql('x'.repeat(10) + '...');
  });

  it('numeric options respected', () => {
    const obj = { name: 'abcdef' };
    const out = Obj.truncateStrings(obj, 3);
    expect(out.name).to.eql('abc...');
  });

  {
    // @ts-expect-error null is not valid T (Record<string, unknown>)
    Obj.truncateStrings(null);
  }
});
