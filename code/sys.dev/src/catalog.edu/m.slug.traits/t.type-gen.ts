/**
 * 🌼 ———— GENERATOR PROMPT:START ./t.type-gen.ts ———————————————————————————————————————
 *
 * @file t.type-gen.ts
 * @summary Public, explicit TS types generated from local runtime schemas.
 *
 * Intent
 * • Provide stable, JSR-safe type aliases for consumers.
 * • Keep runtime schemas in `m.*.ts` and expose them only as `t.TSchema`.
 * • Avoid `Infer<typeof ...>` in the public API to prevent slow types.
 *
 * Source of truth
 * • Schemas live beside this file as `export const <Name>SchemaInternal = T.Object(...)`.
 * • Public schema exports are widened: `export const <Name>Schema: t.TSchema = <Name>SchemaInternal`.
 * • This file mirrors those schemas into explicit type aliases (no interfaces).
 *
 * Generation rules
 * • Preserve property order from the schema declarations.
 * • `T.Optional(X)` → `prop?: ...`.
 * • Primitives map directly (string | number | boolean).
 * • `T.Array(U)` → `readonly U[]`.
 * • `T.Record(T.String(), U)` → `{ readonly [key: string]: U }`.
 * • Unions/literals/enums: keep exact literal unions (e.g., 'a' | 'b' | 3).
 * • `T.Unknown()` → `unknown` (never `any`).
 * • Use `readonly` on all properties/arrays per repo conventions.
 * • ASCII quotes only; no classes; no `this`.
 *
 * Public API hygiene
 * • Export only explicit type aliases from this file (no inferred exports).
 * • Do not export variant schemas directly; export only as `t.TSchema`.
 * • Keep public unions conceptual (domain-level), not implementation details.
 *
 * Regeneration notes
 * • If a schema changes, update `<Name>SchemaInternal` first,
 *   then update these type aliases to match and recompile.
 * • Locks (if used) live in `t.type-gen.lock.ts` and are purely compile-time.
 *
 * 🌼 ———— GENERATOR PROMPT:END ./t.type-gen.ts ———————————————————————————————————————
 */

/**
 * Video Player Properties
 * – mirrors `m.video.player.ts` (`VideoPlayerPropsSchema`)
 */
export type VideoPlayerProps = {
  /** Display name (optional, non-empty if provided). */
  readonly name?: string;

  /** Top level summary. */
  readonly description?: string;

  /** Video source (optional, non-empty if provided). */
  readonly src?: string;
};

/**
 * Video Recorder Properties
 * – mirrors `m.video.recorder.ts` (`VideoRecorderPropsSchema`)
 */
export type VideoRecorderProps = {
  /** Display name (optional, non-empty if provided). */
  readonly name?: string;

  /** Top level summary. */
  readonly description?: string;

  /**
   * Script content displayed during recording.
   * Supports plain text or Markdown.
   */
  readonly script?: string;

  /**
   * CRDT File Reference (URN).
   * Accepts "crdt:create" | "crdt:<uuid|base62-28>/[path]" | "urn:crdt:<uuid|base62-28>/[path]".
   */
  readonly file?: string;
};

/**
 * SlugTreeItem
 * – mirrors `schema.slug.tree.ts` (`SlugTreeItemSchema`)
 *
 * A node carries a required display `slug` and may:
 *  • reference another slug via `ref`
 *  • inline its own traits + data
 *  • contain nested `slugs` (child nodes)
 *  • or combine all forms (hybrid)
 */
export type SlugTreeItem = {
  /** Display label for this node (like a section or chapter title). */
  readonly slug: string;

  /** Optional CRDT or URN reference to an external slug config. */
  readonly ref?: string;

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

  /** Optional description for this node. */
  readonly description?: string;

  /**
   * Optional nested slug-tree children.
   * Each may have its own slug label, ref, and traits/data.
   */
  readonly slugs?: readonly SlugTreeItem[];
};

/**
 * SlugTreeProps
 * – mirrors `schema.slug.tree.ts` (`SlugTreePropsSchema`)
 *
 * The trait’s value is an array of slug-tree items.
 * Each node may contain nested items or inline slug configs.
 */
export type SlugTreeProps = readonly SlugTreeItem[];
