import { Immutable } from '@sys/immutable/rfc6902';
import { type t, describe, expect, it } from '../../../-test.ts';
import { toObject } from '../u.toObject.ts';

describe('toObject', () => {
  it('returns plain object for normal input', () => {
    const input = { msg: 'hi', nested: { x: 1 } };
    const res = toObject(input);
    expect(res).to.eql(input);
  });

  it('returns undefined as-is', () => {
    expect(toObject(undefined)).to.equal(undefined);
  });

  it('flattens Immutable proxy → plain object snapshot', () => {
    const doc = Immutable.cloner({ msg: 'hello', nested: { a: 1, b: 2 } });
    const proxy = doc.current;
    const result = toObject(proxy);
    expect(result).to.eql({ msg: 'hello', nested: { a: 1, b: 2 } });
    expect(result).to.not.equal(proxy); // should be a new plain object
  });

  it('preserves nested values recursively', () => {
    const doc = Immutable.clonerRef({ level1: { level2: { value: 42 } } });
    const proxy = doc.current;
    const result = toObject(proxy);
    expect(result.level1.level2.value).to.equal(42);
  });
});
