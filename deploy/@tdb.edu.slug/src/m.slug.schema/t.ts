import type { t } from './common.ts';

/** Type re-exports. */
export type * from './slug.Manifest/t.ts';
export type * from './slug.MediaComposition.Sequence/t.ts';
export type * from './slug.MediaComposition/t.ts';
export type * from './slug.SlugTree/t.ts';
export type * from './slug.Traits/t.ts';

/**
 * Library of slug related schemas.
 */
export type SlugSchemaLib = {
  readonly Tree: t.SlugTreeSchemaLib;
  readonly Manifest: t.SlugManifestSchemaLib;
  readonly MediaComposition: t.SlugMediaCompositionSchemaLib;
  // readonly MediaComposition1: t.MediaCompositionLib;
};

/**
 * Validation result.
 */
export type ValidateResult<T> = ValidateOK<T> | ValidateFail;
export type ValidateOK<T> = { ok: true; sequence: T };
export type ValidateFail = { ok: false; error: Error };
