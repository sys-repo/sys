import type { t } from './common.ts';
import { SlugUrl, SlugSchema, D, Http } from './common.ts';

export const Tree: t.SlugClientTreeLib = {
  load,
};

async function load(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  options?: t.SlugTreeLoadOptions,
): Promise<t.SlugClientResult<t.SlugTreeDoc>> {
  docid = SlugUrl.Util.cleanDocid(docid);
  const fetch = Http.fetcher();
  const manifests = SlugUrl.Composition.manifestsLocation(baseUrl, options);
  const url = SlugUrl.Composition.manifests({
    baseUrl: manifests.baseUrl,
    manifestsDir: manifests.manifestsDir,
    filename: SlugUrl.treeFilename(docid),
  });
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
