import type { t } from './common.ts';

/**
 * A validator returned from `makeValidator`.
 */
export type Validator<T> = {
  check(value: unknown): value is T;
  validate: ValidateFn;
};

/** Canonical validate function type (kept in one place). */
export type ValidateFn = (value: unknown) => ValidateResult;

/** Single source of truth for the validate result shape. */
export type ValidateResult =
  | { ok: true }
  | { ok: false; errors: ReadonlyArray<{ path: string; message: string }> };

/**
 * Factory signature for creating validators.
 */
export type ValidatorFactory = <S extends t.TSchema, TOut = t.Static<S>>(
  schema: S,
) => Validator<TOut>;

/**
 * Map of per-view props validators keyed by view id.
 */
export type PropsValidators<Id extends string> = Readonly<{
  [K in Id]?: Validator<unknown>;
}>;
