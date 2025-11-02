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
 * DEEP-PASS
 *
 * 🌼 ———— GENERATOR PROMPT:END ./t.type-gen.ts ———————————————————————————————————————
 */
import type { t } from './common.ts';

/**
 * 🌼
 * Source schemas from:
 *  - ./traits.schema/*
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
  readonly file?: t.StringCrdtRef;
};

/**
 * Cropmarks sizing (union variants), mirrors Pattern.UI.Cropmarks.Size():
 * - center: optional width/height (px)
 * - fill: optional x/y booleans, optional margin (number>=0 or string shorthand)
 * - percent: optional width/height/maxWidth/maxHeight (0..100 at runtime), optional margin,
 *            optional aspectRatio (string like "16/9" or positive number)
 *
 * Note: numeric ranges are enforced at runtime by the schema, not in TS types.
 */
export type CropmarksSizeCenter = {
  readonly mode: 'center';
  readonly width?: number;
  readonly height?: number;
};

export type CropmarksSizeFill = {
  readonly mode: 'fill';
  readonly x?: boolean;
  readonly y?: boolean;
  readonly margin?: number | string;
};

export type CropmarksSizePercent = {
  readonly mode: 'percent';
  readonly width?: number;
  readonly height?: number;
  readonly margin?: number | string;
  readonly aspectRatio?: string | number;
  readonly maxWidth?: number;
  readonly maxHeight?: number;
};

export type CropmarksSize = CropmarksSizeCenter | CropmarksSizeFill | CropmarksSizePercent;

/**
 * Cropmarks configuration object nested under `view-renderer.props.cropmarks`.
 * Mirrors `schema.view-renderer.ts`.
 */
export type CropmarksConfig = {
  /** Optional cropmarks sizing configuration. */
  readonly size?: CropmarksSize;
  /** Only show the subject and skip rendering cropmarks. */
  readonly subjectOnly?: boolean;
};

/**
 * View Renderer Properties
 * - mirrors `schema.view-renderer.ts` (`ViewRendererPropsSchema`)
 */
export type ViewRendererProps = {
  /** Identifier of the view to render (id-pattern). */
  readonly view?: string;

  /**
   * Reference to properties of the view, or an inline property bag.
   * Accepts:
   *  - CRDT ref string (e.g., "crdt:create", "crdt:self/path", "crdt:<id>/path", "urn:crdt:<id>/path")
   *  - arbitrary key/value object (PropertyBag)
   */
  readonly props?: t.StringCrdtRef | PropertyBag;

  /** Optional cropmarks configuration object. */
  readonly cropmarks?: CropmarksConfig;
};

/** Generic property bag (mirrors `T.Record(T.String(), T.Unknown())`). */
export type PropertyBag = { readonly [key: string]: unknown };

/**
 * Concept Layout Properties
 * - mirrors `schema.concept-layout.ts` (`ConceptLayoutPropsSchema`)
 */
export type ConceptLayoutProps = {
  /**
   * CRDT document reference for this layout's config/state.
   * Accepts "crdt:create" | "crdt:<uuid|base62-28>/[path]" | "urn:crdt:<uuid|base62-28>/[path]".
   */
  readonly slug: t.StringCrdtRef;
};

/**
 * File List Properties
 * - mirrors `schema.file-list.ts` (`FileListPropsSchema`)
 */
export type FileListProps = {
  /** Optional display name for the file list. */
  readonly name?: string;
  /** List of file path references. */
  readonly files: readonly string[];
};
