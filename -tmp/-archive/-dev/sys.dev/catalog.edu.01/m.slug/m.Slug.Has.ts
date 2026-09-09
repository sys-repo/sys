import { type t, Is } from './common.ts';

export const Has: t.SlugHasLib = {
  /** True if the slug defines a `traits` array (narrows to include `traits`). */
  traits(
    slug,
  ): slug is (t.SlugMinimal | t.SlugWithData) & { traits: readonly t.SlugTraitBinding[] } {
    if (!Is.record(slug)) return false;
    const traits = (slug as { traits?: unknown }).traits;
    return Array.isArray(traits);
  },

  /** True if the slug defines a `data` record (narrows to include `data`). */
  data(slug): slug is t.SlugWithData {
    if (!Is.record(slug)) return false;
    return Is.record((slug as { data?: unknown }).data);
  },
};
