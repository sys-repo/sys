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
