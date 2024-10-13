import { describe, expect, it } from '../-test.ts';
import { rx, Rx } from './mod.ts';

describe('Observable/rx', () => {
  const Is = Rx.Is;

  describe('Rx.Is.event', () => {
    const test = (input: any, expected: boolean) => {
      expect(Is.event(input)).to.eql(expected);
    };

    it('is an event', () => {
      test({ type: 'MyEvent', payload: {} }, true);
    });

    it('is not an event', () => {
      test(undefined, false);
      test(null, false);
      test(1, false);
      test(true, false);
      test('two', false);
      test({}, false);
      test({ type: 123, payload: {} }, false);
      test({ type: 'FOO' }, false);
      test({ type: 'FOO', payload: 123 }, false);
    });

    it('is an event of given type', () => {
      const test = (input: any, type: any, expected: boolean) => {
        expect(rx.Is.event(input, type)).to.eql(expected);
      };

      test(undefined, 'foo', false);
      test(null, 'foo', false);
      test(123, 'foo', false);
      test({}, 'foo', false);
      test({ type: 'foo', payload: {} }, 'bar', false);

      test({ type: 'foo', payload: {} }, 'foo', true);
      test({ type: 'foo/bar', payload: {} }, { startsWith: 'foo/bar' }, true);
      test({ type: 'foo/bar', payload: {} }, { startsWith: 'foo/' }, true);
      test({ type: 'foo/bar', payload: {} }, { startsWith: 'foo' }, true);

      test({ type: 'foo', payload: {} }, '  foo  ', false);
      test({ type: 'foo', payload: {} }, 123, false);
      test({ type: 'foo', payload: {} }, null, false);
      test({ type: 'foo', payload: {} }, {}, false);
      test({ type: 'foo/bar', payload: {} }, { startsWith: undefined }, false);
      test({ type: 'foo/bar', payload: {} }, { startsWith: null }, false);
    });
  });

  it('Is.observable', () => {
    const test = (input: any, expected: boolean) => {
      expect(Is.observable(input)).to.eql(expected);
    };

    test(undefined, false);
    test(null, false);
    test('hello', false);
    test(1223, false);
    test({}, false);

    test({ subscribe: () => null }, true);
    test(Rx.subject<void>(), true);
    test(Rx.subject<void>().asObservable(), true);

    const $ = Rx.subject() as unknown;
    if (Is.observable<number>($)) {
      $.subscribe(); // Type inferred after boolean check.
    }
  });

  it('Is.subject', () => {
    const test = (input: any, expected: boolean) => {
      expect(Is.subject(input)).to.eql(expected);
    };

    test(undefined, false);
    test(null, false);
    test('hello', false);
    test(1223, false);
    test({}, false);

    test({ subscribe: () => null }, false);
    test({ subscribe: () => null, next: () => null }, true);

    test(Rx.subject<void>(), true);
    test(Rx.subject<void>().asObservable(), false);

    const $ = Rx.subject() as unknown;
    if (Is.subject<number>($)) {
      $.next(1234); // Type inferred after boolean check.
    }
  });
});
