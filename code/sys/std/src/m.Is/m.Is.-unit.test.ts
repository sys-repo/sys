import { describe, expect, it } from '../-test.ts';
import { Err, Is, Rx } from '../mod.ts';

describe('Is (common flags)', () => {
  it('rx: observable | subject', () => {
    // NB: tested in the corresponding module file.
    expect(Is.observable).to.equal(Rx.Is.observable);
    expect(Is.subject).to.equal(Rx.Is.subject);
  });

  it('error', () => {
    expect(Is.errorLike).to.equal(Err.Is.errorLike);
    expect(Is.stdError).to.equal(Err.Is.stdError);
  });

  it('Is.promise', () => {
    const test = (input: any, expected: boolean) => {
      expect(Is.promise(input)).to.eql(expected);
    };

    const myPromise = () => new Promise<void>((resolve) => resolve());
    const wait = async () => await myPromise();

    test(undefined, false);
    test(123, false);
    test('hello', false);
    test(['hello', 123], false);
    test(true, false);
    test(null, false);
    test({}, false);

    test({ then: () => null }, true);
    test(wait(), true);
    test(myPromise(), true);

    const p = myPromise as unknown;
    if (Is.promise<string>(p)) {
      p.then(); // Type inferred after boolean check.
    }
  });

  it('Is.numeric', () => {
    const assert = (value: unknown, expected: boolean) => {
      expect(Is.numeric(value)).to.eql(expected);
    };
    assert(123, true);
    assert('456', true);
    assert('123.456', true);
    assert('  789  ', true);
    assert('12e3', true);
    assert('0xFF', true);
    assert('NaN', false);
    assert(NaN, false);
    assert(null, false);
    assert('Infinity', false);
    assert('-Infinity', false);
    assert('', false);
    assert('   ', false);
    assert('abc123', false);
    assert(null, false);
    assert(undefined, false);
    assert(true, false);
    assert({}, false);
    assert([], false);
    assert(BigInt(123), true);
  });

  it('Is.falsy', () => {
    const test = (input: unknown, expected: boolean) => {
      expect(Is.falsy(input)).to.eql(expected, input);
    };
    test(false, true);
    test(0, true);
    test('', true);
    test(null, true);
    test(undefined, true);
    test(NaN, true);
    test(BigInt(0), true);

    test(42, false);
    test('Hello', false);
    test({}, false);
    test([], false);
    test(true, false);
    test(Symbol('foo'), false);
    test(BigInt(1), false);
    test(new Date(), false);
  });

  describe('Is.json', () => {
    it('is not JSON', () => {
      expect(Is.json()).to.eql(false);
      expect(Is.json(null)).to.eql(false);
      expect(Is.json(123)).to.eql(false);
      expect(Is.json(new Date())).to.eql(false);
      expect(Is.json({})).to.eql(false);
    });

    it('is a string but not JSON', () => {
      expect(Is.json('')).to.eql(false);
      expect(Is.json('  ')).to.eql(false);
      expect(Is.json('hello')).to.eql(false);
    });

    it('is JSON', () => {
      expect(Is.json('{}')).to.eql(true);
      expect(Is.json('[]')).to.eql(true);
      expect(Is.json('{ "foo": 123 }')).to.eql(true);
      expect(Is.json('[1,2,3]')).to.eql(true);
    });

    it('is JSON (trimmed string)', () => {
      expect(Is.json('  {} ')).to.eql(true);
      expect(Is.json(' []  ')).to.eql(true);
    });
  });
});
