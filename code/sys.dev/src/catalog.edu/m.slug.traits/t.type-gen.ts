/**
 * 🌸 ———— GENERATOR PROMPT:START ./t.type-gen.ts ———————————————————————————————————————
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
 * 🌸 ———— GENERATOR PROMPT:END ./t.type-gen.ts ———————————————————————————————————————
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
 * Slug Index Properties
 * – mirrors `m.slug.index.ts` (`SlugIndexPropsSchema`)
 */
export type SlugIndexProps = {
  /** Display name (optional, non-empty if provided). */
  readonly name?: string;

  /** Top level summary. */
  readonly description?: string;

  /**
   * Array of slug references.
   * Each entry may include a human-friendly name and must include a CRDT ref.
   */
  readonly index: readonly {
    /** Human label for the referenced slug. */
    readonly name?: string;

    /**
     * CRDT Slug Reference (URN).
     * Accepts "crdt:<uuid|base62-28>/[path]" | "urn:crdt:<uuid|base62-28>/[path]".
     */
    readonly ref: string;
  }[];
};

/**
 * Slug Tree Item
 * – mirrors `m.slug.tree.ts` (`SlugTreeItemSchema`)
 *
 * A node may:
 *  • reference a document via `ref` (leaf),
 *  • contain `slugs` (group),
 *  • or do both (hybrid).
 */
export type SlugTreeItem = {
  /**
   * Human-readable display name (like a chapter or section title).
   * Not globally unique; scope is local to this tree.
   */
  readonly name: string;

  /**
   * CRDT Slug Reference (URN).
   * Accepts:
   *   crdt:create
   *   crdt:<uuid|base62-28>/[path]
   *   urn:crdt:<uuid|base62-28>/[path]
   */
  readonly ref?: string;

  /**
   * Ordered child nodes of this branch.
   * Each may have its own CRDT ref, child slugs, or both.
   */
  readonly slugs?: readonly SlugTreeItem[];

  /** Optional human summary for this node. */
  readonly description?: string;
};

/**
 * Slug Tree Properties
 * – mirrors `m.slug.tree.ts` (`SlugTreePropsSchema`)
 *
 * Top-level structure defining a hierarchical set of slug references
 * (tree of documents or sections).
 */
export type SlugTreeProps = {
  /**
   * Ordered root nodes of the slug tree.
   * Each slug (node) may have its own CRDT ref, child slugs, or both.
   */
  readonly slugs: readonly SlugTreeItem[];

  /**
   * (Optional) human readable, high-level description of the entire tree.
   */
  readonly description?: string;
};
