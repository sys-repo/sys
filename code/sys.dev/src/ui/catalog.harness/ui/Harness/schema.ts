import { CommonThemeSchema, CssInputSchema } from '@sys/schema/ui';
import { type t, Type } from '../common.ts';

/**
 * Minimal schema for the left/right Harness shell.
 */
export const HarnessSchema: t.TObject<{
  leftWidth: t.TOptional<t.TNumber>;
  gap: t.TOptional<t.TNumber>;
  debug: t.TOptional<t.TBoolean>;
  theme: t.TOptional<typeof CommonThemeSchema>;
  style: t.TOptional<typeof CssInputSchema>;
}> = Type.Object(
  {
    leftWidth: Type.Optional(Type.Number({ description: 'Left pane width (px)' })),
    gap: Type.Optional(Type.Number({ description: 'Gap between panes (px)' })),
    debug: Type.Optional(Type.Boolean({ description: 'Debug flag' })),
    theme: Type.Optional(CommonThemeSchema),
    style: Type.Optional(CssInputSchema),
  },
  { additionalProperties: false },
);
