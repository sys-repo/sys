import search from 'approx-string-match';
import type { t } from '../common.ts';

/**
 * Approximate string matching.
 */
export const Fuzzy: t.FuzzyLib = {
  /**
   * Match using the given "input" pattern.
   */
  pattern(pattern, options = {}) {
    const { maxErrors = 2 } = options;
    const api: t.FuzzyMatcher = {
      pattern,
      match(input?: string) {
        const text = input ?? '';
        const matches = search(text, pattern, maxErrors);
        return {
          exists: matches.length > 0,
          matches,
          pattern,
          text,
          get range() {
            const start = matches[0]?.start ?? -1;
            const end = matches[matches.length - 1]?.end ?? -1;
            const exists = start !== -1 && end !== -1;
            return {
              start,
              end,
              text: exists ? text.substring(start, end) : '',
            };
          },
        };
      },
    };
    return api;
  },
};
