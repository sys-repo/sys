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
    /**
     * `props` may be:
     * - a CRDT reference (string pattern), or
     * - a generic "property bag" object (Record<string, unknown>).
     */
    props: T.Optional(
      T.Union([toSchema(Pattern.Ref.Crdt()), T.Record(T.String(), T.Unknown())], {
        description: 'Reference to properties of the view, or an inline property bag.',
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
