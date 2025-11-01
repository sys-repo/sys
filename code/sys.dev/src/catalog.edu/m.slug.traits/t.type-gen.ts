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
 * 🌼
 * Source schemas from:
 *  - ./schema.traits/*
 */

/**
 * Video Player Properties
 * - mirrors `m.video.player.ts` (`VideoPlayerPropsSchema`)
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
 * - mirrors `m.video.recorder.ts` (`VideoRecorderPropsSchema`)
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
 * View Renderer Properties
 * - mirrors `schema.view-renderer.ts` (`ViewRendererPropsSchema`)
 */
export type ViewRendererProps = {
  /** Display name (optional, non-empty if provided). */
  readonly view?: string;
};
