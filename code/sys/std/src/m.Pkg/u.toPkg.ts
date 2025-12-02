import { type t, D, isRecord } from './common.ts';

export const toPkg: t.PkgLib['toPkg'] = (input) => {
  /**
   * String form ­- "<name>@<version>".
   * Handles scoped names (e.g. "@scope/pkg@1.2.3").
   */
  if (typeof input === 'string') {
    const text = input.trim();
    const i = text.lastIndexOf('@');
    if (i > 0) {
      const name = text.slice(0, i);
      const version = text.slice(i + 1);
      if (name && version) return { name, version };
    }
    return { ...D.UNKNOWN };
  }

  /**
   * Object form ­- { name, version }.
   */
  if (!isRecord(input)) return { ...D.UNKNOWN };
  const { name, version } = input as Record<string, unknown>;
  return typeof name === 'string' && typeof version === 'string'
    ? { name, version }
    : { ...D.UNKNOWN };
};
