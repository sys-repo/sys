import { type t } from './common.ts';

/**
 * Helpers:
 */
export const validationOk = (): t.PlanValidateOk => ({ ok: true });

/** Create typed validation errors using exceptions for early exit. */
export function validationError(
  code: 'UNKNOWN_VIEW_ID' | 'INVALID_SLOT',
  message: string,
  path: ReadonlyArray<number>,
  allowed?: ReadonlyArray<string>,
  got?: string,
): t.PlanValidateErr {
  return {
    ok: false,
    error: { code, message, path, allowed, got },
  };
}
