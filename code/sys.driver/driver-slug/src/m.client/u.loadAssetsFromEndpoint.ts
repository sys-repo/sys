import type { t } from './common.ts';
import { AssetsSchema, Http, Url } from './common.ts';
import { SlugUrl } from './m.Url.ts';
import { formatSchemaReason } from './u.schema.ts';

const CACHE_INIT: RequestInit = { cache: 'no-cache' };

export async function loadAssetsFromEndpoint(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  init?: RequestInit,
): Promise<t.Result<t.SpecTimelineAssetsManifest>> {
  const fetch = Http.client();
  const cleanedDocid = SlugUrl.clean(docid);
  const url = Url.parse(baseUrl).join('manifests', SlugUrl.assetsFilename(cleanedDocid));
  const req: RequestInit = { ...(init ?? {}), ...CACHE_INIT };

  const res = await fetch.json<unknown>(url, req);
  if (!res.ok) {
    return {
      ok: false,
      error: {
        kind: 'http',
        status: res.status,
        statusText: res.statusText,
        url: res.url,
      },
    };
  }

  const parsed = AssetsSchema.Manifest.parse(res.data);
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
