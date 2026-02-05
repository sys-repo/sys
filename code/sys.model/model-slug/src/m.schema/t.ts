import type { t } from './common.ts';

/** Type re-exports. */
export type * from './m.Manifest.Assets/t.ts';
export type * from './m.Manifest/t.ts';
export type * from './m.Bundle/t.ts';
export type * from './m.MediaComposition.Sequence/t.ts';
export type * from './m.MediaComposition/t.ts';
export type * from './m.SlugFileContent/t.ts';
export type * from './m.SlugTree/t.ts';
export type * from './m.Traits/t.ts';

/**
 * Slug content-model schemas.
 *
 * Defines the canonical **slug-domain** schema surface used by authoring tools,
 * validators, and loaders. This library composes lower-level model schemas
 * (e.g. timecode, assets) into slug-specific structures such as trees,
 * manifests, and media compositions.
 *
 * Scope:
 * - Structural and semantic validation of slug content
 * - No transport or runtime concerns
 * - No UI or tooling behavior
 */
export type SlugSchemaLib = {
  readonly Tree: t.SlugTreeSchemaLib;
  readonly FileContent: t.SlugFileContentSchemaLib;
  readonly Manifest: t.SlugManifestSchemaLib;
  readonly MediaComposition: t.SlugMediaCompositionSchemaLib;
  readonly Traits: t.SlugTraitsSchemaLib;
  readonly BundleDescriptor: t.BundleDescriptorSchemaLib;
};

/**
 * Validation result.
 */
export type SlugValidateResult<T> = SlugValidateOK<T> | SlugValidateFail;
/** Successful validation result wrapper. */
export type SlugValidateOK<T> = { ok: true; sequence: T };
/** Failed validation result wrapper. */
export type SlugValidateFail = { ok: false; error: Error };

/**
 * Errors.
 */
/** Schema value error with path context. */
export type SchemaValueError = {
  readonly path: string | readonly string[];
  readonly message: string;
};
