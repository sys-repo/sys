import { type t, describe, expectTypeOf, it } from '../../-test.ts';
import { css } from '../../mod.ts';

describe('Style: types', () => {
  describe('custom css-properties', () => {
    it('accepts custom --vars + standard props together', () => {
      const input = {
        width: 200,
        containerType: 'inline-size',
        ['--pct-w']: 80,
        ['--pct-h']: '15',
      } satisfies t.Style.Props;

      // Also acceptable as a Style.Value input to css():
      expectTypeOf(input).toMatchTypeOf<t.Style.Props>();
      const out = css(input);
      expectTypeOf(out).toMatchTypeOf<t.Style.Transform.Result>();
    });

    it('rejects invalid value types', () => {
      // @ts-expect-error boolean is not allowed for custom properties:
      const bad: t.Style.Props = { ['--foo']: true };
      void bad;
    });

    it('allows any --${string} key', () => {
      const vars = {
        ['--anything-goes']: 1,
        ['--dash-separated-name']: '42',
      } satisfies t.Style.Props;
      expectTypeOf(vars).toMatchTypeOf<t.Style.Props>();
    });
  });
});
