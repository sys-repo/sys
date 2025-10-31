/**
 * Types for the YAML → Schema pipeline.
 */
import type { t } from './common.ts';

export type * from './t.Slug.err.ts';
export type * from './t.Slug.fromYaml.ts';
export type * from './t.Slug.rules.ts';

/**
 * Namespace: tools within the YAML pipeline related to slug interpretation.
 */
export type YamlSlugLib = {
  /** Semantic Slug domain tools (registry-aware validators, helpers). */
  readonly Domain: t.SlugLib;
  /** Error helpers. */
  readonly Error: t.YamlSlugErrorLib;
  /** Extract and validate a slug from YAML. */
  readonly fromYaml: t.SlugFromYaml;
};
