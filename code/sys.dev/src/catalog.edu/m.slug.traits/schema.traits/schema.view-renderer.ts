import { Pattern, type t, Type as T } from './common.ts';

/**
 * Properties: View Renderer.
 * Minimal base with standard optional `name` (minLength: 1).
 */
export const ViewRendererPropsSchemaInternal = T.Object(
  {
    view: T.Optional(
      T.String({
        description: `Identifier of the SlugView renderer to use for this slug.`,
        minLength: 1,
      }),
    ),
  },
  {
    $id: 'trait.view-renderer.props',
    title: 'View Renderer Properties',
    additionalProperties: false,
  },
);

/**
 * Public widened export (JSR-safe: explicit t.TSchema surface).
 */
export const ViewRendererPropsSchema: t.TSchema = ViewRendererPropsSchemaInternal;
