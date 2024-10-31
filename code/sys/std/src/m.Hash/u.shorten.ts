import type { t } from '../common.ts';

export const shorten: t.HashLib['shorten'] = (hash, length, options = {}) => {
  const { divider = '..' } = options;

  hash = wrangle.trimPrefixes((hash || '').trim(), options);
  if (!hash) return '';

  const lengths = Array.isArray(length) ? length : [length, length];
  const total = lengths[0] + lengths[1];
  if (total >= hash.length) return hash;

  const left = hash.slice(0, lengths[0]);
  const right = hash.slice(0 - lengths[1]);

  if (lengths[0] <= 0) return right;
  if (lengths[1] <= 0) return left;

  return `${left}${divider}${right}`;
};

/**
 * Helpers
 */
const wrangle = {
  trimPrefixes(hash: string, options: t.ShortenHashOptions): string {
    const dividers = wrangle.prefixDivider(options);
    for (const divider of dividers) {
      const index = hash.indexOf(divider);
      if (index > -1) return hash.slice(index + divider.length);
    }
    return hash;
  },

  prefixDivider(options: t.ShortenHashOptions) {
    const input = options.trimPrefix;
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') return [input];
    return ['-', ':'];
  },
};
