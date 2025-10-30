import { SLUG } from '../../m.slug/schema.slug/schema.slug.u.ts';
import { type t, Type as T } from './common.ts';

/**
 * Canonical slug-tree item.
 *
 * Structure
 * - Required: slug (human-facing display label).
 * - Optional children: slugs?: SlugTreeItem[] (ordered, may be empty).
 * - Inline slug surface (DRY from core): id, description, ref, traits, data.
 *
 * Semantics
 * - Tree-only relaxation: ref MAY coexist with traits/data (hybrid).
 * - Schema-only: does NOT require data keys to match traits[*].as
 *   (semantic binding is validated elsewhere).
 * - Unknown keys are rejected (additionalProperties: false).
 * - All inline field atoms are sourced from core SLUG.* to avoid drift.
 *
 * Examples
 * ```yaml
 *  # Minimal
 *  - slug: Intro
 *
 *  # Ref-only
 *  - slug: Intro
 *    ref: crdt:create
 *
 *  # Inline traits + data
 *  - slug: Video
 *    traits:
 *      - of: "video-player"
 *        as: "vid"
 *    data:
 *      vid: { src: "intro.mp4", start: 3.2 }
 *
 *  # Hybrid (tree-only)
 *  - slug: Video
 *    ref: crdt:create
 *    traits:
 *      - of: "video-player"
 *        as: "vid"
 *    data:
 *      vid: { src: "intro.mp4" }
 *
 *  # Nested
 *  - slug: Section A
 *    slugs:
 *      - slug: Getting Started
 *        ref: crdt:create
 * ```
 */
export const SlugTreeItemSchemaInternal = T.Recursive(
  (Self) =>
    T.Object(
      {
        // Tree-local scaffolding:
        slug: T.String({
          minLength: 1,
          title: 'Display name',
          description: `Human-readable label for this node (like a section or chapter title). Not globally unique.`,
        }),
        slugs: T.Optional(
          T.Array(Self, {
            title: 'Child Slugs (Nodes)',
            description: 'Optional ordered children for this branch.',
          }),
        ),

        id: T.Optional(SLUG.ID),
        description: T.Optional(SLUG.DESCRIPTION),
        ref: T.Optional(SLUG.REF),
        traits: T.Optional(SLUG.TRAITS),
        data: T.Optional(SLUG.DATA),
      },
      {
        additionalProperties: false, // reject unknown keys (eg "foo": 123)
        description: `Slug-tree node: display label and optional children, with optional inline Slug surface.`,
      },
    ),
  {
    $id: 'trait.slug-tree.item',
    title: 'Slug Tree Item',
    description: `A node in the slug-tree hierarchy that may inline or reference core slug configs.`,
  },
);

/**
 * Root trait data schema.
 *
 * YAML shape:
 * data:
 *   my-tree:
 *     - slug: Section A
 *       slugs:
 *         - slug: Intro
 *           ref: crdt:create
 *         - slug: Video
 *           traits:
 *             - of: video-player
 *               as: vid
 *           data:
 *             vid: { src: "intro.mp4", start: 3.2 }
 *
 * Top-level value is an array of items (no wrapping object).
 */
export const SlugTreePropsSchemaInternal = T.Array(SlugTreeItemSchemaInternal, {
  $id: 'trait.slug-tree',
  title: 'Slug Tree',
  description: `Ordered list of slug-tree items. Each item carries a display label and may inline core slug fields or reference external configs.`,
});

/**
 * Public widened exports (JSR-safe: explicit t.TSchema surface).
 */
export const SlugTreeItemSchema: t.TSchema = SlugTreeItemSchemaInternal;
export const SlugTreePropsSchema: t.TSchema = SlugTreePropsSchemaInternal;
