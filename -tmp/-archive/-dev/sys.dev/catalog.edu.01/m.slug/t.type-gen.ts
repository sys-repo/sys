/**
 * 🌼 ———— GENERATOR PROMPT:START ./t.type-gen.ts ———————————————————————————————————————
 *
 * @file t.type-gen.ts
 * @summary Public, explicit TS types generated from local runtime schemas.
 *
 * Intent
 *  • Provide stable, JSR-safe type aliases for consumers.
 *  • Keep runtime schemas in `m.*.ts` and expose them only as `t.TSchema`.
 *  • Avoid `Infer<typeof ...>` in the public API to prevent slow types.
 *
 * Source of truth
 *  • Schemas live beside this file as `export const <Name>SchemaInternal = T.Object(...)`.
 *  • Public schema exports are widened: `export const <Name>Schema: t.TSchema = <Name>SchemaInternal`.
 *  • This file mirrors those schemas into explicit type aliases (no interfaces).
 *
 * Generation rules
 *  • Preserve property order from the schema declarations.
 *  • `T.Optional(X)` → `prop?: ...`.
 *  • Primitives map directly (string | number | boolean).
 *  • `T.Array(U)` → `readonly U[]`.
 *  • `T.Record(T.String(), U)` → `{ readonly [key: string]: U }`.
 *  • Unions/literals/enums: keep exact literal unions (e.g., 'a' | 'b' | 3).
 *  • `T.Unknown()` → `unknown` (never `any`).
 *  • Use `readonly` on all properties/arrays per repo conventions.
 *  • ASCII quotes only; no classes; no `this`.
 *
 * Public API hygiene
 *  • Export only explicit type aliases from this file (no inferred exports).
 *  • Do not export variant schemas directly; export only as `t.TSchema`.
 *  • Keep public unions conceptual (domain-level), not implementation details.
 *
 * Regeneration notes
 *  • If a schema changes, update `<Name>SchemaInternal` first,
 *   then update these type aliases to match and recompile.
 *  • Locks (if used) live in `t.type-gen.lock.ts` and are purely compile-time.
 *
 * 🌼 ———— GENERATOR PROMPT:END ./t.type-gen.ts ———————————————————————————————————————
 */

/**
 * 🌳
 * Source schemas from:
 *  - ./schema.slug/*
 *  - ./schema.slug.traits/*
 */

/**
 * Slug Reference
 * - mirrors `schema.slug.ts` (`SlugRefSchema`)
 *
 * Optional identifier and description; may include an optional CRDT/URN reference.
 * Cannot contain traits or data.
 */
export type SlugRef = {
  /** Optional stable slug identifier. */
  readonly id?: string;

  /** Optional human-readable description of the slug’s purpose. */
  readonly description?: string;

  /**
   * Optional reference to another slug.
   * Accepts:
   *   crdt:create
   *   crdt:<uuid|base62-28>/[path]
   *   urn:crdt:<uuid|base62-28>/[path]
   */
  readonly ref?: string;
};

/**
 * Slug Minimal
 * - mirrors `schema.slug.ts` (`SlugMinimalSchema`)
 *
 * Optional id/description with optional trait bindings.
 * No `data` field.
 */
export type SlugMinimal = {
  /** Optional stable slug identifier. */
  readonly id?: string;

  /** Optional human-readable description. */
  readonly description?: string;

  /**
   * Optional list of trait bindings applied to this slug.
   * Each binding defines a trait type (`of`) and alias (`as`).
   */
  readonly traits?: readonly {
    readonly of: string;
    readonly as: string;
  }[];
};

/**
 * Slug With Data
 * - mirrors `schema.slug.ts` (`SlugWithDataSchema`)
 *
 * Optional id/description, required traits, and a required `data` record keyed by trait alias.
 */
export type SlugWithData = {
  /** Optional stable slug identifier. */
  readonly id?: string;

  /** Optional human-readable description. */
  readonly description?: string;

  /**
   * Required list of trait bindings.
   * Each binding defines a trait type (`of`) and alias (`as`).
   */
  readonly traits: readonly {
    readonly of: string;
    readonly as: string;
  }[];

  /**
   * Serialized instance data keyed by trait alias.
   * Each value is validated semantically against the corresponding trait schema.
   */
  readonly data: { readonly [key: string]: unknown };
};

/**
 * Slug
 * - mirrors `schema.slug.ts` (`SlugSchema`)
 *
 * Disjoint union of all valid slug variants.
 * - `SlugRef`: pointer-only form.
 * - `SlugMinimal`: inline minimal definition.
 * - `SlugWithData`: inline definition with traits and data.
 */
export type Slug = SlugRef | SlugMinimal | SlugWithData;

/**
 * SlugTreeItem
 * - mirrors `schema.slug.tree.ts` (`SlugTreeItemSchema`)
 *
 * A node has a stable required `slug` and is either:
 *  • Ref-only: `slug` + `ref` (no other properties)
 *  • Inline:  `slug` + optional `description` | `traits` | `data` | `slugs` (no `ref`)
 */

export type SlugTreeItemRefOnly = {
  /** Stable tree-local label or identifier. */
  readonly slug: string;
  /** External reference to a slug config. No other properties permitted in this variant. */
  readonly ref: string;
};

export type SlugTreeItemInline = {
  /** Stable tree-local label or identifier. */
  readonly slug: string;

  /** Optional human-readable description for this node. */
  readonly description?: string;

  /**
   * Optional trait bindings applied inline to this slug.
   * Each binding maps a trait type to a local alias.
   */
  readonly traits?: readonly {
    /** Trait type identifier. */
    readonly of: string;
    /** Local alias name under which trait data is stored. */
    readonly as: string;
  }[];

  /**
   * Arbitrary data map keyed by local alias (trait instance data).
   * Values are validated semantically by the respective trait schema.
   */
  readonly data?: { readonly [key: string]: unknown };

  /**
   * Optional nested slug-tree children.
   * Each may have its own slug label and inline structure.
   */
  readonly slugs?: readonly SlugTreeItem[];
};

export type SlugTreeItem = SlugTreeItemRefOnly | SlugTreeItemInline;

/**
 * SlugTreeProps
 * - mirrors `schema.slug.tree.ts` (`SlugTreePropsSchema`)
 *
 * The trait’s value is an array of slug-tree items.
 * Each node may contain nested items or inline slug configs.
 */
export type SlugTreeProps = readonly SlugTreeItem[];
