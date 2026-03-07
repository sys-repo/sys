import { describe, expect, it } from '../../-test.ts';
import { Await, maybeWait } from '../mod.ts';

describe('Await.maybeWait', () => {
  type T = { count: number };
  const fn1 = (): T => ({ count: 1 });
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
    expect(Await.maybeWait).to.equal(maybeWait);
  });
});

// deno-lint-ignore require-await
it('isPromise', async () => {
  const test = (input: any, expected: boolean) => {
    expect(Await.isPromise(input)).to.eql(expected);
  };

  // deno-lint-ignore require-await
  const wait = async () => null;

  test({ then: () => null }, true);
  test(wait(), true);
  [undefined, null, 123, 'a', [], {}, true].forEach((value) => test(value, false));
});
