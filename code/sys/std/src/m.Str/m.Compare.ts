import { type t } from './common.ts';

const collatorCache = new Map<string, Intl.Collator>();

export const Compare: t.StrCompareLib = {
  codeUnit() {
    return (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
  },

  natural(options?: t.StrCompareOptions) {
    const collator = getCollator(options);
    return (a: string, b: string) => collator.compare(a, b);
  },
};

/**
 * Helpers
 */
const collatorKey = (options?: t.StrCompareOptions) => {
  const locale = String(options?.locale ?? 'en');
  const sensitivity = String(options?.sensitivity ?? 'base');
  return `${locale}::${sensitivity}`;
};

const getCollator = (options?: t.StrCompareOptions) => {
  const key = collatorKey(options);
  const cached = collatorCache.get(key);
  if (cached) return cached;
  const locale = String(options?.locale ?? 'en');
  const sensitivity = options?.sensitivity ?? 'base';
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity });
  collatorCache.set(key, collator);
  return collator;
};
