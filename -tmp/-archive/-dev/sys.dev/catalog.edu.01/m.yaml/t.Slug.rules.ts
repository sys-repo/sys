import type { t } from './common.ts';

/**
 * Delegate used by the YAML pipeline to determine if a given
 * trait ID exists in the active registry.
 */
export type SlugIsKnown = (id: t.StringId) => boolean;

/**
 * Shared semantic rule types for the YAML pipeline.
 * `isKnown` should return true iff the given trait `id` is in the active registry.
 */
export type SlugRuleCtx = { isKnown?: t.SlugIsKnown };

/** Uniform signature for all semantic rules. */
export type SlugRuleFn = (
  mutErrors: t.DeepMutable<t.SlugYamlErrors>['semantic'],
  base: t.ObjectPath,
  slug: unknown,
  ctx?: SlugRuleCtx,
) => boolean;

/** Optional suite type to strongly type the SlugRules object. */
export type SlugRuleSuite = {
  aliasUniqueness: SlugRuleFn;
  traitTypeKnown: SlugRuleFn;
  missingDataForAlias: SlugRuleFn;
  orphanData: SlugRuleFn;
};
