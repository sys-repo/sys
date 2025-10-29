/**
 * @file t.type-gen.ts
 * @summary Generated TypeScript type definitions mapped from local runtime schemas.
 *
 * Purpose:
 * • Provide stable, explicit TS types for external use (JSR-safe).
 * • Keep runtime schemas in `m.*.ts`; do NOT `Infer` from widened `t.TSchema`.
 *
 * Generation rules (concise, repeatable):
 * • Source: scan sibling `m.*.ts` files for `export const <Name>Schema = T.Object(...)` (and related).
 * • Emit: `export type <Name>... = { ... }` with props in the SAME order as the schema declaration.
 * • Optionality: `T.Optional(X)` → `prop?: ...`.
 * • Primitives: map directly (string | number | boolean).
 * • Arrays: `T.Array(U)` → `readonly U[]`.
 * • Records: `T.Record(T.String(), U)` → `{ readonly [key: string]: U }` (no `any`).
 * • Unions/Literals/Enums: preserve literal unions (e.g., `'a' | 'b' | 3`).
 * • Unknown: `T.Unknown()` → `unknown` (never `any`).
 * • Readonly: prefer `readonly` props and `readonly T[]` throughout.
 * • Style: type aliases (not interfaces), small functions, no classes/`this`, ASCII quotes only.
 *
 * Public API & JSR slow-type hygiene:
 * • Do NOT export variant runtime schemas directly; expose them only via a widened `t.TSchema` surface.
 * • All exported symbols in this file must be explicit type aliases (no inferred exports).
 * • Avoid emitting discriminated unions that mirror internal schema implementation details; only export
 *   unions that form part of the public conceptual model.
 * • No ambient declarations (`declare global`) or ambient module hacks.
 *
 * Naming:
 * • Concrete object shapes end with `Props`, `Item`, or `Entry` as appropriate.
 * • Public unions end with the domain noun (e.g., `Thing`), not `Schema`.
 *
 * Drift checks (local, not exported):
 * • For each generated type `X`, add a compile-time equality test against `t.Static<typeof XSchema>`
 *   using local test utilities. These tests live in test fixtures and are not exported.
 *
 * Notes:
 * • Public runtime schemas may still be re-exported as `t.TSchema` for validation/metadata use.
 * • External consumers should import these generated types directly (not `Infer<typeof ...>`).
 */

/**
 * Slug Reference
 * – mirrors `schema.slug.ts` (`SlugRefSchema`)
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
 * – mirrors `schema.slug.ts` (`SlugMinimalSchema`)
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
 * – mirrors `schema.slug.ts` (`SlugWithDataSchema`)
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
 * – mirrors `schema.slug.ts` (`SlugSchema`)
 *
 * Disjoint union of all valid slug variants.
 * - `SlugRef`: pointer-only form.
 * - `SlugMinimal`: inline minimal definition.
 * - `SlugWithData`: inline definition with traits and data.
 */
export type Slug = SlugRef | SlugMinimal | SlugWithData;
