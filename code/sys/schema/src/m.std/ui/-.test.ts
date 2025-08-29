import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { CommonThemeSchema, CssScalarSchema } from './mod.ts';

describe('schemas: @sys/schema/std/ui', () => {
  it('module exports', async () => {
    const m = await import('@sys/schema/std/ui');
    expect(m).to.be.ok;
    expect(m.CommonThemeSchema).to.be.ok;
    expect(m.CssScalarSchema).to.be.ok;
    expect(m.CssInputSchema).to.be.ok;
  });

  describe('ui', () => {
    it('CommonThemeSchema → "Light" | "Dark"', async () => {
      type Theme = t.Static<typeof CommonThemeSchema>;
      // Type shape:
      expectTypeOf<Theme>('Dark').toEqualTypeOf<'Light' | 'Dark'>();

      // Compile-time usage examples:
      const light: Theme = 'Light';
      const dark: Theme = 'Dark';
      // @ts-expect-error - not allowed
      const nope: Theme = 'Midnight';
      void [light, dark, nope];
    });

    it('CssScalarSchema → string | number | boolean | null', async () => {
      type Scalar = t.Static<typeof CssScalarSchema>;
      expectTypeOf<Scalar>(true).toEqualTypeOf<string | number | boolean | null>();

      // Compile-time examples
      const s1: Scalar = 'px';
      const s2: Scalar = 12;
      const s3: Scalar = false;
      const s4: Scalar = null;
      // @ts-expect-error - object not allowed
      const bad1: Scalar = { x: 1 };
      // @ts-expect-error - array not allowed
      const bad2: Scalar = [1, 2];
      void [s1, s2, s3, s4, bad1, bad2];
    });

    it('CssInputSchema → recursive, general CSS value (infer as unknown)', async () => {
      const { CssInputSchema } = await import('@sys/schema/std/ui');

      // We intentionally keep runtime acceptance broad; static type is unknown.
      type CssInput = t.Static<typeof CssInputSchema>;

      // Compile-time permissiveness examples (these should all type-check as unknown):
      const a: CssInput = false;
      const b: CssInput = null;
      const c: CssInput = { fontSize: 12, ':hover': { color: 'red' } };
      const d: CssInput = [12, '1rem', { margin: [4, 8] }];
      void [a, b, c, d];
    });
  });
});
