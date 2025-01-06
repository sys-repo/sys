import { type t, Path } from './common.ts';

/**
 * Helpers
 */
export const Wrangle = {
  options(input?: t.FsCopyOptions | t.FsCopyFilter): t.FsCopyOptions {
    if (!input) return {};
    if (typeof input === 'function') return { filter: input };
    return input;
  },

  filter(source: t.StringPath, target: t.StringPath, filter?: t.FsCopyFilter): boolean {
    if (!filter) return true;
    source = Path.absolute(source);
    target = Path.absolute(target);
    return filter({ source, target });
  },
} as const;
