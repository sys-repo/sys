import type { t } from './common.ts';
import { D, Http, SlugSchema, Url } from './common.ts';
import { SlugUrl } from './m.Url.ts';
import { formatSchemaReason } from './u.schema.ts';

export const FileContent: t.SlugClientFileContentLib = {
  index,
  get,
};

async function index(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  options?: t.SlugLoadOptions,
): Promise<t.SlugClientResult<t.SlugFileContentIndex>> {
  const fetch = Http.fetcher();
  const cleanedDocid = SlugUrl.clean(docid);
  const url = Url.parse(baseUrl).join('manifests', SlugUrl.treeAssetsFilename(cleanedDocid));
  const req: RequestInit = { ...D.CACHE_INIT, ...(options?.init ?? {}) };
  req.cache = D.CACHE_INIT.cache;

  const res = await fetch.json<unknown>(url, req);
  if (!res.ok) {
    return {
      ok: false,
      error: {
        kind: 'http',
        message: `Slug-file-content index fetch failed. ${res.status} ${res.statusText} @ ${res.url ?? url}`,
        status: res.status,
        statusText: res.statusText,
        url: res.url ?? url,
      },
    };
  }

  const parsed = SlugSchema.FileContent.Index.parse(res.data);
  if (!parsed.ok) {
    const reason = formatSchemaReason(parsed.errors);
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Slug-file-content index failed @sys/schema validation. Reason: ${reason}`,
      },
    };
  }

  const manifest = parsed.value;
  if (manifest.docid !== cleanedDocid) {
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Slug-file-content index docid mismatch. Expected: ${cleanedDocid}. Got: ${manifest.docid}`,
      },
    };
  }

  return { ok: true, value: manifest };
}

async function get(
  baseUrl: t.StringUrl,
  hash: string,
  options?: t.SlugFileContentLoadOptions,
): Promise<t.SlugClientResult<t.SlugFileContentDoc>> {
  const fetch = Http.fetcher();
  const dir = options?.dir ?? 'json';
  const url = Url.parse(baseUrl).join(dir, SlugUrl.fileContentFilename(hash));
  const req: RequestInit = { ...D.CACHE_INIT, ...(options?.init ?? {}) };
  req.cache = D.CACHE_INIT.cache;

  const res = await fetch.json<unknown>(url, req);
  if (!res.ok) {
    return {
      ok: false,
      error: {
        kind: 'http',
        message: `Slug-file-content fetch failed. ${res.status} ${res.statusText} @ ${res.url ?? url}`,
        status: res.status,
        statusText: res.statusText,
        url: res.url ?? url,
      },
    };
  }

  const parsed = SlugSchema.FileContent.Props.parse(res.data);
  if (!parsed.ok) {
    const reason = formatSchemaReason(parsed.errors);
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Slug-file-content payload failed @sys/schema validation. Reason: ${reason}`,
      },
    };
  }

  return { ok: true, value: parsed.value };
}
