import type { t } from './common.ts';
import { D, Http, SlugSchema } from './common.ts';
import { SlugUrl } from './m.Url.ts';
import { ClientUrl } from './u.url.ts';
import { formatSchemaReason } from './u.schema.ts';

export const Assets: t.SlugClientAssetsLib = {
  load,
};

async function load(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  options?: t.SlugLoadOptions,
): Promise<t.SlugClientResult<t.SpecTimelineAssetsManifest>> {
  const fetch = Http.fetcher();
  const cleanedDocid = SlugUrl.clean(docid);
  const manifestsDir = options?.layout?.manifestsDir ?? 'manifests';
  const url = ClientUrl.manifests({
    baseUrl,
    manifestsDir,
    filename: SlugUrl.assetsFilename(cleanedDocid),
  });
  const req: RequestInit = { ...D.CACHE_INIT, ...(options?.init ?? {}) };
  req.cache = D.CACHE_INIT.cache;

  const res = await fetch.json<unknown>(url, req);
  if (!res.ok) {
    const msg = (msg: string) => `${msg} ${res.status} ${res.statusText} @ ${res.url ?? url}`;

    if (res.status === 404) {
      return {
        ok: false,
        error: {
          kind: 'http',
          message: msg('Assets manifest missing despite dist.json entry.'),
          status: res.status,
          statusText: res.statusText,
          url: res.url ?? url,
        },
      };
    }
    return {
      ok: false,
      error: {
        kind: 'http',
        message: msg('Assets manifest fetch failed.'),
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
