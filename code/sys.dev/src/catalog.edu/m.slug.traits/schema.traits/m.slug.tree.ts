import { Pattern, Type as T } from './common.ts';

/**
 * Canonical "slug tree" node schema.
 *
 * ─────────────────────────────────────────────
 *  YAML authoring intent (concise DSL):
 *
 *    - generic-canvas-program:
 *        ref: crdt:create
 *        items:
 *          - program-outline: crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P
 *          - trailer: crdt:create
 *          - business-model-design:
 *              ref: crdt:create
 *              items:
 *                - understanding-business-model: crdt:create
 *
 *  Normalized canonical form (after DSL → schema normalization):
 *
 *    items:
 *      - label: generic-canvas-program
 *        ref: crdt:create
 *        items:
 *          - label: program-outline
 *            ref: crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P
 *          - label: trailer
 *            ref: crdt:create
 *          - label: business-model-design
 *            ref: crdt:create
 *            items:
 *              - label: understanding-business-model
 *                ref: crdt:create
 *
 * ─────────────────────────────────────────────
 *
 * The schema below validates only the *canonical* normalized structure.
 * Authoring-time YAML will be normalized into this shape within `m.yaml`
 * (see `u.slug.tree.normalize.ts`).
 */
const Label = T.String({ minLength: 1 });

export const SlugTreeItemSchema = T.Recursive(
  (Self) =>
    T.Object(
      {
        /** Human-readable label (rendered as the node title). */
        label: Label,

        /** CRDT reference to the slug (URN with optional path). */
        ref: T.Optional(
          T.String({ title: 'Slug Reference (CRDT/URN)', ...Pattern.crdtRefPattern() }),
        ),

        /** Optional nested children (ordered). */
        items: T.Optional(T.Array(Self)),

        /** Optional human summary/description for UIs. */
        summary: T.Optional(T.String()),
      },
      { additionalProperties: false },
    ),
  { $id: 'trait.slug-tree.item', title: 'Slug Tree Item' },
);

/**
 * Top-level "slug tree" props schema.
 *
 * YAML authoring intent (concise):
 *
 *   programme-v1:
 *     - content-creation:
 *         items:
 *           - example-scripts:
 *               items:
 *                 - age-co-uk-example-script: crdt:create
 *                 - patagonia-example-script: crdt:create
 *
 * Canonical normalized form (validated by schema):
 *
 *   programme-v1:
 *     items:
 *       - label: content-creation
 *         items:
 *           - label: example-scripts
 *             items:
 *               - label: age-co-uk-example-script
 *                 ref: crdt:create
 *               - label: patagonia-example-script
 *                 ref: crdt:create
 *
 * Normalization handled by: `u.slug.tree.normalize.ts`
 */
export const SlugTreePropsSchema = T.Object(
  {
    /** Ordered root items of the tree. */
    items: T.Array(SlugTreeItemSchema),

    /** Optional human summary/description for the entire tree. */
    summary: T.Optional(T.String()),
  },
  {
    $id: 'trait.slug-tree.props',
    title: 'Slug Tree Properties',
    additionalProperties: false,
  },
);
