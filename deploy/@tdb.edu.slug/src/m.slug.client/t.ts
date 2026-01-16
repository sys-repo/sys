import type { t } from './common.ts';

/**
 * Slug client ingress (HTTP + schema validation).
 *
 * Pure client-side domain loader.
 * No UI, no FS, no compilation concerns.
 */
export type SlugClientLib = {
  /**
   * Load the slug-tree manifest for a given docid from an HTTP endpoint.
   *
   * Contract:
   * - Fetch `${baseUrl}/manifests/slug-tree.${docid}.json`.
   * - Validate against the canonical slug-tree schema.
   * - Return typed domain data (`t.SlugTreeProps`) or throw on failure.
   */
  readonly loadSlugTreeFromEndpoint: (
    baseUrl: t.StringUrl,
    docid: t.Crdt.Id,
    init?: RequestInit,
  ) => Promise<t.SlugTreeProps>;
};
