export type * from './lint/t.ts';
export type * from './resolve/t.ts';
export type * from './slug/t.ts';
export type * from './tasks/t.ts';

/**
 * Validation result.
 */
export type ValidateResult<T> = ValidateOK<T> | ValidateFail;
export type ValidateOK<T> = { ok: true; sequence: T };
export type ValidateFail = { ok: false; error: Error };
