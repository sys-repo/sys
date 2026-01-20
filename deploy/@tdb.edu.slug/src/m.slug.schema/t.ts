import type { t } from './common.ts';

export type * from './slug.SlugTree/t.ts';
export type * from './slug.Traits/t.ts';
export type * from './slug.MediaComposition.Sequence/t.ts';

/**
 * Library of slug related schemas.
 */
export type SlugSchemaLib = {
  readonly Tree: t.SlugTreeSchemaLib;
};

/**
 * Validation result.
 */
export type ValidateResult<T> = ValidateOK<T> | ValidateFail;
export type ValidateOK<T> = { ok: true; sequence: T };
export type ValidateFail = { ok: false; error: Error };
