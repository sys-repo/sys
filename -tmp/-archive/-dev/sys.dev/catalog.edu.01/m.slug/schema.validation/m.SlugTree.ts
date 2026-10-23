import type { t } from './common.ts';
import { validateSlugTreeWithRanges as validateWithRanges } from './u.slug.tree.ts';

export const SlugTree: t.SlugTreeValidationLib = {
  validateWithRanges,
};
