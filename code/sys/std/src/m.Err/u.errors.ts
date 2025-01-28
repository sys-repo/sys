import type { t } from './common.ts';
import { std } from './u.std.ts';

/**
 * Create a new error collection builder.
 */
export const errors: t.ErrLib['errors'] = () => {
  const set = new Set<t.StdError>();
  const api: t.ErrorCollection = {
    get ok() {
      return api.length === 0;
    },
    get length() {
      return set.size;
    },
    get list() {
      return Array.from(set);
    },
    get is() {
      const empty = set.size === 0;
      return { empty };
    },

    push(...args: any[]) {
      const items = wrangle.pushArgs(args);
      items.forEach((err) => set.add(std(err)));
      return api;
    },

    toError(pluralMessage = 'Several errors occured.') {
      const total = set.size;
      const errors = Array.from(set);
      if (total === 0) return undefined;
      if (total === 1) return errors[0];
      if (errors.length > 1) {
        return std(pluralMessage, { errors });
      }
      return undefined;
    },
  };

  return api;
};

/**
 * Helpers
 */
const wrangle = {
  pushArgs(args: any[]): t.StdError[] {
    if (args.length === 1) {
      const input = args[0];
      return Array.isArray(input) ? input : [input];
    }
    if (args.length === 2) {
      return [std(args[0], { cause: args[1] })];
    }
    return [];
  },
} as const;
