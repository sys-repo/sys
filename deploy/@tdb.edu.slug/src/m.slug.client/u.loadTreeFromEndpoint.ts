import { validateSlugTree } from '../m.slug.schema/slug.SlugTree/u.validate.ts';
import { type t, Http } from './common.ts';

export const loadTreeFromEndpoint: t.SlugClientLib['loadTreeFromEndpoint'] = async (
  baseUrl,
  docid,
  init = {},
) => {
  const manifestInit: RequestInit = { cache: 'no-cache', ...init };
  const fetch = Http.fetcher();
  const manifestUrl = new URL(`manifests/slug-tree.${docid}.json`, new URL(baseUrl)).toString();

  const res = await fetch.json<unknown>(manifestUrl, manifestInit);
  if (!res.ok) {
    return {
      ok: false,
      error: {
        kind: 'http',
        message: `Slug-tree manifest fetch failed. ${res.status} ${res.statusText} @ ${manifestUrl}`,
        status: res.status,
        statusText: res.statusText,
        url: manifestUrl,
      },
    };
  }

  const parsed = validateSlugTree(res.data);
  if (!parsed.ok) {
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Slug-tree validation failed. ${parsed.error.message}`,
      },
    };
  }

  return { ok: true, value: parsed.sequence };
};
