import { validateSlugTree } from '../m.slug.compiler/slug.SlugTree/u.validate.ts';
import { type t, Http } from './common.ts';

/**
 * Slug client ingress (HTTP + schema validation).
 */
export const SlugClient: t.SlugClientLib = {
  async loadSlugTreeFromEndpoint(baseUrl, docid, init) {
    const manifestInit: RequestInit = { cache: 'no-cache', ...(init ?? {}) };
    const fetch = Http.fetcher();
    const manifestUrl = new URL(`manifests/slug-tree.${docid}.json`, new URL(baseUrl)).toString();

    const res = await fetch.json<unknown>(manifestUrl, manifestInit);
    if (!res.ok) {
      const err = `Slug-tree manifest fetch failed. ${res.status} ${res.statusText} @ ${manifestUrl}`;
      throw new Error(err);
    }

    const parsed = validateSlugTree(res.data);
    if (!parsed.ok) {
      const err = `Slug-tree validation failed. ${parsed.error.message}`;
      throw new Error(err);
    }

    return parsed.sequence;
  },
};
