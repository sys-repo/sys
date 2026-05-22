import { type t } from './common.ts';
import { normalize } from './u.slug.err.normalize.ts';
import { attachSemanticRanges } from './u.slug.err.semantics.ts';

export * from './u.slug.err.semantics.ts';

export const Error: t.YamlSlugErrorLib = {
  normalize,
  attachSemanticRanges,
};
