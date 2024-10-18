import { describe, expect, it } from '../-test.ts';
import { Promise, maybeWait } from './mod.ts';

describe('Promise', () => {
  describe('maybeWait', () => {
    type T = { count: number };
    const fn1 = (): T => ({ count: 1 });
    // deno-lint-ignore require-await
    const fn2 = async (): Promise<T> => ({ count: 2 });

    it('sync', async () => {
      const res = await maybeWait(fn1());
      expect(res).to.eql({ count: 1 });
    });

    it('async', async () => {
      const res = await maybeWait(fn2());
      expect(res).to.eql({ count: 2 });
    });

    it('exposed from Promise', () => {
      expect(Promise.maybeWait).to.equal(maybeWait);
    });
  });

  // deno-lint-ignore require-await
  it('isPromise', async () => {
    const test = (input: any, expected: boolean) => {
      expect(Promise.isPromise(input)).to.eql(expected);
    };

    // deno-lint-ignore require-await
    const wait = async () => null;

    test({ then: () => null }, true);
    test(wait(), true);
    [undefined, null, 123, 'a', [], {}, true].forEach((value) => test(value, false));
  });
});
