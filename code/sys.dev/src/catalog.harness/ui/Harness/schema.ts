import {
  type t,
  CommonThemeSchema,
  CssInputSchema,
  ImmutableRefSchemaId,
  Type as T,
} from '../common.ts';

/**
 * Minimal schema for the left/right Harness shell.
 */
export const HarnessPropsSchema: t.TObject<{
  debug: t.TOptional<t.TBoolean>;
  theme: t.TOptional<typeof CommonThemeSchema>;
  style: t.TOptional<typeof CssInputSchema>;
  state: t.TOptional<t.TRef<typeof ImmutableRefSchemaId>>;
}> = T.Object(
  {
    debug: T.Optional(T.Boolean({ description: 'Debug flag' })),
    theme: T.Optional(CommonThemeSchema),
    style: T.Optional(CssInputSchema),
    state: T.Optional(T.Ref(ImmutableRefSchemaId)),
  },
  {
    $id: 'urn:sys:dev:harness',
    additionalProperties: false,
  },
);
