import { type t, Pattern, Type as T } from './common.ts';

/**
 * Properties: Time Map.
 * A simple label → timestamp map (milliseconds since Unix epoch).
 */
export const TimeMapPropsSchemaInternal = T.Object(
  {
    id: T.Optional(T.String({ title: 'Formal identifier of the time map.', ...Pattern.Id() })),
    name: T.Optional(T.String({ description: 'Display name for the time map.' })),
    description: T.Optional(T.String({ description: 'Description of the time map.' })),

  },
  {
    $id: 'trait.time-map.props',
    title: 'Time Map Properties',
    additionalProperties: false,
  },
);

/**
 * Public widened export (JSR-safe: explicit t.TSchema surface).
 */
export const TimeMapPropsSchema: t.TSchema = TimeMapPropsSchemaInternal;
