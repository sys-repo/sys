import type { t } from './common.ts';

/**
 * Authoring DSL parsed directly from YAML (pre-normalize).
 * Keep permissive to reflect what users can write.
 *
 * NOTE: currently used only for type reference in the normalization bridge;
 * schema validation runs on canonical `Slug` shape.
 */
export type SlugAuthoring = {
  readonly id?: string;
  readonly traits?: readonly { readonly of?: string; readonly as?: string }[];
  readonly data?: Record<string, unknown>;
};
