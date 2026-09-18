/**
 * Types for the YAML → Schema pipeline.
 */
import type { t } from './common.ts';
export type * from './t.Slug.ts';

/**
 * Namespace: tools that handle the pipe of
 * YAML → Schema → Object and back again.
 */
export type YamlPipelineLib = {
  /** Slug tools. */
  readonly Slug: t.YamlSlugLib;
};
