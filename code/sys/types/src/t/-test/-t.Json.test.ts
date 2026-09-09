import { describe, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';

describe('Types: JsonLikeU', () => {
  it('accepts readonly arrays for input-like JSON', () => {
    const value = { rules: ['a', 'b'] as const };
    expectTypeOf(value).toMatchTypeOf<t.JsonMapLikeU>();
    expectTypeOf(value).toMatchTypeOf<t.JsonLikeU>();
  });

  it('does not treat readonly arrays as canonical JsonU', () => {
    const value = { rules: ['a', 'b'] as const };
    // @ts-expect-error readonly arrays must not flow into canonical JsonU.
    const json: t.JsonU = value;
    void json;
  });
});
