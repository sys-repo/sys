import type { t } from './common.ts';
import { SlugSchema, D, Http, Url } from './common.ts';
import { SlugUrl } from './m.Url.ts';

export const Tree: t.SlugClientTreeLib = {
  load,
};

async function load(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  options?: t.SlugLoadOptions,
): Promise<t.Result<t.SlugTreeItems>> {
  docid = SlugUrl.clean(docid);
  const fetch = Http.fetcher();
  const url = Url.parse(baseUrl).join('manifests', SlugUrl.treeFilename(docid));
  const req: RequestInit = { ...D.CACHE_INIT, ...(options?.init ?? {}) };
  req.cache = D.CACHE_INIT.cache;

  const res = await fetch.json<unknown>(url, req);
  if (!res.ok) {
    return {
      ok: false,
      error: {
        kind: 'http',
        message: `Slug-tree manifest fetch failed. ${res.status} ${res.statusText} @ ${res.url ?? url}`,
        status: res.status,
        statusText: res.statusText,
        url: res.url ?? url,
      },
    };
  }

  const parsed = SlugSchema.Tree.validate(res.data);
  if (!parsed.ok) {
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Slug-tree validation failed. ${parsed.error.message}`,
      },
    };
  }

  return {
    ok: true,
    value: parsed.sequence,
  };
}
