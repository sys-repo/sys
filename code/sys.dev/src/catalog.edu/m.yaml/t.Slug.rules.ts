import type { t } from './common.ts';

/**
 * Shared semantic rule types for the YAML pipeline.
 */
export type SlugRuleCtx = {
  /** Optional registry membership check for trait types (eg. "video", "image-sequence"). */
  isKnown?: (id: string) => boolean;
};

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
