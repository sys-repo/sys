import type { t } from './common.ts';

export type SlugClientLib = {
  readonly Url: t.SlugClientUrlLib;
  readonly Tree: t.SlugClientTreeLib;
};

export type SlugClientTreeLib = {
  /**
   * Load the slug-tree manifest for a given docid from an HTTP endpoint.
   * Contract:
   * - Fetch `${baseUrl}/manifests/slug-tree.${docid}.json`.
   * - Validate against the canonical slug-tree schema.
   */
  load(
    baseUrl: t.StringUrl,
    docid: t.Crdt.Id,
    init?: RequestInit,
  ): Promise<t.SlugClientResult<t.SlugTreeItems>>;
};

/** Slug URL helpers */
export type SlugClientUrlLib = {
  clean(docid: string | t.Crdt.Id): string;
};

export type SlugClientResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: SlugClientError };

/**
 * Slug client ingress (HTTP + schema validation).
 *
 * Pure client-side domain loader.
 * No UI, no FS, no compilation concerns.
 */
export type SlugClientError = {
  readonly kind: 'http' | 'schema';
  readonly message: string;
  readonly status?: number;
  readonly statusText?: string;
  readonly url?: string;
};
