import { type t, isRecord } from './common.ts';

/**
 * Type guards describing what kind of slug this is.
 */
export const Is: t.SlugIsLib = {
  /** True if the slug is a reference variant (has `ref` as string). */
  ref(v): v is t.SlugRef {
    return isRecord(v) && typeof (v as { ref?: unknown }).ref === 'string';
  },

  /**
   * True if the slug is an inline variant (no `ref`) and presents inline surface:
   * - traits?: readonly unknown[]
   * - data?:   plain object (non-null, non-array)
   *
   * Note: shape validation belongs to schema/runtime validators; this is a guard.
   */
  inline(v): v is t.SlugMinimal | t.SlugWithData {
    if (!isRecord(v) || 'ref' in v) return false;
    const traitsOk = Array.isArray((v as { traits?: unknown }).traits);
    const dataVal = (v as { data?: unknown }).data;
    const dataOk = isRecord(dataVal);
    return traitsOk || dataOk;
  },
};
