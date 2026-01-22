import type { t } from './common.ts';
import { SlugSchema, D, Http, Url } from './common.ts';
import { SlugUrl } from './m.Url.ts';
import { formatSchemaReason } from './u.schema.ts';

export const Assets: t.SlugClientAssetsLib = {
  load,
};

async function load(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  options?: t.SlugLoadOptions,
): Promise<t.Result<t.SpecTimelineAssetsManifest>> {
  const fetch = Http.fetcher();
  const cleanedDocid = SlugUrl.clean(docid);
  const url = Url.parse(baseUrl).join('manifests', SlugUrl.assetsFilename(cleanedDocid));
  const req: RequestInit = { ...D.CACHE_INIT, ...(options?.init ?? {}) };
  req.cache = D.CACHE_INIT.cache;

  const res = await fetch.json<unknown>(url, req);
  if (!res.ok) {
    return {
      ok: false,
    error: {
      kind: 'http',
      message: `Assets manifest fetch failed. ${res.status} ${res.statusText} @ ${res.url ?? url}`,
      status: res.status,
      statusText: res.statusText,
      url: res.url ?? url,
    },
    };
  }

  const parsed = SlugSchema.Manifest.Assets.Manifest.parse(res.data);
  if (!parsed.ok) {
    const reason = formatSchemaReason(parsed.errors);
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Assets manifest failed @sys/schema validation. Reason: ${reason}`,
      },
    };
  }

  const manifest = parsed.value;
  if (manifest.docid !== cleanedDocid) {
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Assets manifest docid mismatch. Expected: ${cleanedDocid}. Got: ${manifest.docid}`,
      },
    };
  }

  return { ok: true, value: manifest };
}
