import { CommonThemeSchema, CssInputSchema } from '@sys/schema/ui';
import { type t, Type as T } from '../common.ts';

/** Alignment */
export const LayoutAlignSchema = T.Union(
  [T.Literal('Left'), T.Literal('Center'), T.Literal('Right')],
  { description: 'Horizontal alignment' },
);

/**
 * Precise TypeBox schema (JSR-friendly, inference-safe).
 * Consumers can do: `type Layout = t.Infer<typeof LayoutCenterColumnSchema>`
 */
export const LayoutSchema: t.TObject<{
  align: t.TOptional<t.TUnion<[t.TLiteral<'Left'>, t.TLiteral<'Center'>, t.TLiteral<'Right'>]>>;
  centerWidth: t.TOptional<t.TNumber>;
  gap: t.TOptional<t.TNumber>;
  debug: t.TOptional<t.TBoolean>;
  theme: t.TOptional<typeof CommonThemeSchema>;
  style: t.TOptional<typeof CssInputSchema>;
}> = T.Object(
  {
    align: T.Optional(LayoutAlignSchema),
    centerWidth: T.Optional(T.Number({ description: 'px' })),
    gap: T.Optional(T.Number({ description: 'px' })),
    debug: T.Optional(T.Boolean({ description: 'Debug flag' })),
    theme: T.Optional(CommonThemeSchema),
    style: T.Optional(CssInputSchema),
  },
  {
    $id: 'urn:sys:ui:layout-center-column',
    additionalProperties: false,
  },
);
