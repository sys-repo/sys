import { CommonThemeSchema, CssInputSchema } from '@sys/schema/std/ui';
import { type t, Type } from '../common.ts';

/**
 * Precise TypeBox schema (JSR-friendly, inference-safe).
 * Consumers can produce proper type: `type Hello = t.Infer<typeof HelloSchema>`
 */
export const HelloPropsSchema: t.TObject<{
  name: t.TString;
  debug: t.TOptional<t.TBoolean>;
  theme: t.TOptional<typeof CommonThemeSchema>;
  style: t.TOptional<typeof CssInputSchema>;
}> = Type.Object(
  {
    name: Type.String({ description: 'Greeting' }),
    debug: Type.Optional(Type.Boolean({ description: 'Debug flag' })),
    theme: Type.Optional(CommonThemeSchema),
    style: Type.Optional(CssInputSchema),
  },
  { additionalProperties: false },
);
