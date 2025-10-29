import { Pattern, Type as T } from './common.ts';

/**
 * Canonical "slug tree" node schema.
 *
 * ─────────────────────────────────────────────
 *  YAML authoring intent (concise DSL):
 *
 *  ✅
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
 *
 *
 *    🐷🌸 NOTE: normalizer (WIP) - normalizer not exposed by schema
 *    (awaiting complete YAML pipeline impl. → Validator-to-diagnostics → editor range errors/hints)
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
 *
 * ─────────────────────────────────────────────
 *
 * The schema below validates only the *canonical* (✅) normalized structure.
 * Authoring-time YAML will be normalized into this shape within module: `m.yaml`
 * (see `u.slug.tree.normalize.ts`).
 */
export const SlugTreeItemSchema = T.Recursive(
  (Self) =>
    T.Object(
      {
        name: T.String({
          minLength: 1,
          title: 'Node Name',
          description: `Human-readable display name (like a chapter or section title). Not globally unique; scope is local to this tree.`,
        }),

        ref: T.Optional(
          T.String({ title: 'Slug Reference (CRDT/URN)', ...Pattern.crdtRefPattern() }),
        ),

        items: T.Optional(
          T.Array(Self, {
            title: 'Child Items',
            description: 'Optional ordered child nodes of this branch.',
          }),
        ),

        summary: T.Optional(
          T.String({
            title: 'Summary',
            description: 'Optional human summary for this node.',
          }),
        ),
      },
      {
        additionalProperties: false,
        description: 'A node in a Slug Tree: may have its own CRDT ref, child items, or both.',
      },
    ),
  {
    $id: 'trait.slug-tree.item',
    title: 'Slug Tree Item',
  },
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
    items: T.Array(SlugTreeItemSchema, {
      title: 'Root Items',
      description: `Ordered root nodes of the slug tree. Each node may have its own CRDT ref, child items, or both.`,
    }),

    summary: T.Optional(
      T.String({
        title: 'Summary',
        description: `Optional human summary or high-level description for the entire tree. Useful for display in UIs.`,
      }),
    ),
  },
  {
    $id: 'trait.slug-tree.props',
    title: 'Slug Tree Properties',
    description: `Top-level structure defining a hierarchical set of slug references (tree of documents or sections).`,
    additionalProperties: false,
  },
);
