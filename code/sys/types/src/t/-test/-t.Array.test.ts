import { describe, expectTypeOf, it } from '../../-test.ts';

describe('Types: Array Assignability', () => {
  it('mutable array is assignable to readonly array input', () => {
    const mutable: string[] = ['a', 'b'];
    expectTypeOf(mutable).toMatchTypeOf<readonly string[]>();
  });

  it('readonly array is not assignable to mutable array input', () => {
    const readonlyArr: readonly string[] = ['a', 'b'];
    // @ts-expect-error readonly cannot flow to mutable.
    const mutable: string[] = readonlyArr;
    void mutable;
  });
});
