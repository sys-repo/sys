/**
 * @file t.type-gen.ts
 * @summary Generated TypeScript type definitions mapped from local runtime schemas.
 *
 * These types are stable, explicit exports for external use (JSR-safe).
 * The runtime schemas remain in the `m.*.ts` files; do not `Infer` from widened public `TSchema`.
 *
 * Generation rules (concise, repeatable):
 * • Source: scan sibling `m.*.ts` files for `export const <Name>Schema = T.Object(...)`.
 * • Emit: `export type <Name>Props = { ... }` with fields mirroring the schema in declaration order.
 * • Optionality: `T.Optional(X)` → property marked optional (`?`).
 * • Primitives: strings/numbers/booleans map directly; include brief doc from `title`/`description` if useful.
 * • Arrays: `T.Array(U)` → `readonly U[]`.
 * • Records: `T.Record(T.String(), U)` → `{ readonly [key: string]: U }`.
 * • Unions/Literals/Enums: emit TS literal unions.
 * • Unknown: `T.Unknown()` → `unknown` (never `any`).
 * • Readonly: prefer `readonly` props and `readonly T[]` per repo conventions.
 * • Style: type aliases (not interfaces), ASCII quotes, small functions, no classes/`this`.
 *
 * Notes:
 * • Public runtime schemas may be exposed via a widened `t.TSchema` surface (e.g. a namespace),
 *   but external consumers should import these generated types directly (not `Infer<typeof ...>`).
 * • Schema ↔ type drift is enforced with compile-time guards (see `@sys/schema/testing`).
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
 *  • contain `items` (group),
 *  • or do both (hybrid).
 */
export type SlugTreeItem = {
  /** Human-readable label (node title). */
  readonly label: string;

  /**
   * CRDT Slug Reference (URN).
   * Accepts:
   *   crdt:create
   *   crdt:<uuid|base62-28>/[path]
   *   urn:crdt:<uuid|base62-28>/[path]
   */
  readonly ref?: string;

  /** Ordered children. */
  readonly items?: readonly SlugTreeItem[];

  /** Optional human summary/description. */
  readonly summary?: string;
};

/**
 * Slug Tree Properties
 * – mirrors `m.slug.tree.ts` (`SlugTreePropsSchema`)
 */
export type SlugTreeProps = {
  /** Ordered root items of the tree. */
  readonly items: readonly SlugTreeItem[];

  /** Optional human summary/description for the entire tree. */
  readonly summary?: string;
};
