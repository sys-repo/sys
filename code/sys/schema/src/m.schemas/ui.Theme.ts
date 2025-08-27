import { type t, Type } from './common.ts';

/**
 * Schema for: CommonTheme.
 */
export const CommonThemeSchema: t.TUnion<[t.TLiteral<'Light'>, t.TLiteral<'Dark'>]> = Type.Union(
  [Type.Literal('Light'), Type.Literal('Dark')],
  { $id: 'CommonTheme' },
);
