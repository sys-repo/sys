import { type t, Pattern, Type as T, toSchema } from './common.ts';

/**
 * Properties: View Renderer.
 * Minimal base with standard optional `name` (minLength: 1).
 */
export const ViewRendererPropsSchemaInternal = T.Object(
  {
    view: T.Optional(
      T.String({
        ...Pattern.Id(),
        description: `Identifier of the view to render.`,
      }),
    ),
    cropmarks: T.Optional(
      T.Object(
        {
          size: T.Optional({
            ...toSchema(Pattern.UI.Cropmarks.Size()),
            description: `Cropmarks sizing configuration.`,
          }),
          subjectOnly: T.Optional(
            T.Boolean({
              description: `Only show the subject and skip rendering cropmarks`,
              default: true,
            }),
          ),
        },
        {
          additionalProperties: false,
          description: 'Cropmarks configuration.',
        },
      ),
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
