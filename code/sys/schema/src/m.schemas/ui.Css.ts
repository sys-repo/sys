import { type t, Type } from './common.ts';

/**
 * Scalar CSS atoms.
 */
export const CssScalarSchema: t.TUnion<[t.TString, t.TNumber, t.TBoolean, t.TNull]> = Type.Union(
  [
    Type.String(),
    Type.Number(),
    Type.Boolean(), // admits `false`
    Type.Null(),
  ],
  { $id: 'CssScalar' },
);

/**
 * Recursive CssInput:
 * - object of CssInput values (CssProps, pseudos, templates, transformed)
 * - array of CssInput
 * - null or literal false
 */
export const CssInputSchema: t.TRecursive<
  t.TUnion<[t.TArray<any>, t.TObject, t.TNull, t.TLiteral<false>]>
> = Type.Recursive(
  (Css) =>
    Type.Union([
      Type.Array(Css),
      Type.Object({}, { additionalProperties: Css, $id: 'CssObject' }),
      Type.Null(),
      Type.Literal(false),
    ]),
  { $id: 'CssInput' },
);
