import { type t, Type } from '../common.ts';

/** Stable $id for cross-package $ref. */
export const ImmutableRefSchemaId: 'urn:sys:schema:immutable-ref' = 'urn:sys:schema:immutable-ref';

/**
 * Minimal, truthful JSON Schema for an ImmutableRef:
 * - require presence of { instance, current, change, events }.
 * - represent functions as Function nodes (no param/return detail).
 * - allow additional implementation fields.
 *
 * TS precision (draft type, events signatures, etc.) is handled in
 * your public TS surfaces (e.g., props: { state?: t.ImmutableRef }).
 */
export const ImmutableRefSchema: t.TObject<{
  instance: t.TString;
  current: t.TUnknown;
  change: t.TSchema; // function schema node
  events: t.TSchema; // function schema node
}> = Type.Object(
  {
    instance: Type.String({
      title: 'Instance',
      readOnly: true,
      description: 'Unique handle id',
    }),
    current: Type.Unknown({
      title: 'Current',
      readOnly: true,
      description: 'Current value',
    }),

    // Require function presence (no param/return details in schema):
    change: Type.Function([], Type.Unknown(), {
      title: 'Change (Mutate)',
      description: 'Function that applies a mutator to the current value',
    }),
    events: Type.Function([], Type.Unknown(), {
      title: 'Events',
      description: 'Function that returns an events observable handle',
    }),
  },
  {
    title: 'ImmutableRef',
    description: `Runtime handle to Immutable<T> (non-serializable reference). Requires {instance,current,change,events}.`,
    $id: ImmutableRefSchemaId,
    additionalProperties: true,
  },
);
