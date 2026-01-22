import { Http, PlaybackSchema, Url } from './common.ts';

import { type t, D } from './common.ts';
import { SlugUrl } from './m.Url.ts';
import { formatSchemaReason } from './u.schema.ts';

export const Playback: t.SlugClientPlaybackLib = {
  load,
};

async function load<P = unknown>(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  options?: t.SlugLoadOptions,
): Promise<t.Result<t.SpecTimelineManifest<P>>> {
  const fetch = Http.fetcher();
  const cleanedDocid = SlugUrl.clean(docid);
  const url = Url.parse(baseUrl).join('manifests', SlugUrl.playbackFilename(cleanedDocid));
  const req: RequestInit = { ...D.CACHE_INIT, ...(options?.init ?? {}) };
  req.cache = D.CACHE_INIT.cache;

  const res = await fetch.json<unknown>(url, req);
  if (!res.ok) {
    return {
      ok: false,
    error: {
      kind: 'http',
      message: `Playback manifest fetch failed. ${res.status} ${res.statusText} @ ${res.url ?? url}`,
      status: res.status,
      statusText: res.statusText,
      url: res.url ?? url,
    },
    };
  }

  const parsed = PlaybackSchema.Manifest.parse<P>(res.data);
  if (!parsed.ok) {
    const reason = formatSchemaReason(parsed.errors);
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Playback manifest failed @sys/schema validation. Reason: ${reason}`,
      },
    };
  }

  const manifest = parsed.value;
  if (manifest.docid !== cleanedDocid) {
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Playback manifest docid mismatch. Expected: ${cleanedDocid}. Got: ${manifest.docid}`,
      },
    };
  }

  return { ok: true, value: manifest };
}
