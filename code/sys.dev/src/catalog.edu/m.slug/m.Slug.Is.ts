import { type t } from './common.ts';

/**
 * Type guards describing what kind of slug this is.
 */
export const Is: t.SlugIsLib = {
  /** True if the slug is a reference variant (has `ref`). */
  ref(v): v is t.SlugRef {
    return typeof (v as { ref?: unknown }).ref === 'string';
  },

  /** True if the slug is an inline variant (minimal or with-data). */
  inline(v): v is t.SlugMinimal | t.SlugWithData {
    const s = v as { traits?: unknown; data?: unknown };
    return Array.isArray(s.traits) || typeof s.data === 'object';
  },
};
