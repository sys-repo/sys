import { type t, Is } from './common.ts';

export const Has: t.SlugHasLib = {
  /** True if the slug defines a `traits` array. */
  traits(slug): slug is t.SlugMinimal | t.SlugWithData {
    if (!Is.record(slug)) return false;
    return Array.isArray((slug as { traits?: unknown }).traits);
  },

  /** True if the slug defines a `data` record. */
  data(slug): slug is t.SlugWithData {
    if (!Is.record(slug)) return false;
    return Is.record((slug as { data?: unknown }).data);
  },
};
