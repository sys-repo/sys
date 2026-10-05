import { PlaybackSchema } from './common.ts';

import { D, SlugUrl, type t } from './common.ts';
import { fetchJson } from './u.fetch.ts';
import { formatSchemaReason } from './u.schema.ts';

export const Playback: t.SlugClientPlaybackLib = { load };

async function load<P = unknown>(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  options: t.SlugLoadOptions,
): Promise<t.SlugClientResult<t.SpecTimelineManifest<P>>> {
  const cleanedDocid = SlugUrl.Util.cleanDocid(docid);
  const manifests = SlugUrl.Composition.manifestsLocation(baseUrl, options);
  const url = SlugUrl.Composition.manifests({
    baseUrl: manifests.baseUrl,
    manifestsDir: manifests.manifestsDir,
    filename: SlugUrl.playbackFilename(cleanedDocid),
  });
  const req: t.HttpFetch.Init = { ...D.CACHE_INIT, ...(options?.init ?? {}) };
  req.cache = D.CACHE_INIT.cache;

  const res = await fetchJson<unknown>(url, req, options);
  if (!res.ok) {
    return {
      ok: false,
      error: {
        kind: 'http',
        message: `Playback manifest fetch failed. ${res.status} ${res.statusText} @ ${
          res.url ?? url
        }`,
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
        message:
          `Playback manifest docid mismatch. Expected: ${cleanedDocid}. Got: ${manifest.docid}`,
      },
    };
  }

  return { ok: true, value: manifest };
}
