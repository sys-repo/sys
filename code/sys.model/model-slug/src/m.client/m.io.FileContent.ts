import type { t } from './common.ts';
import { D, Http, Schema, SlugSchema } from './common.ts';
import { SlugUrl } from './m.Url.ts';
import { ClientUrl } from './u.url.ts';
import { formatSchemaReason } from './u.schema.ts';

export const FileContent: t.SlugClientFileContentLib = {
  index,
  get,
};

async function index(
  baseUrl: t.StringUrl,
  docid: t.StringId,
  options?: t.SlugFileContentLoadOptions,
): Promise<t.SlugClientResult<t.SlugFileContentIndex>> {
  const fetch = Http.fetcher();
  const cleanedDocid = SlugUrl.clean(docid);
  const manifestsBaseUrl = options?.manifestsBaseUrl ?? baseUrl;
  const manifestsDir = options?.layout?.manifestsDir ?? 'manifests';
  const url = ClientUrl.manifests({
    baseUrl: manifestsBaseUrl,
    manifestsDir,
    filename: SlugUrl.treeAssetsFilename(cleanedDocid),
  });
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

  const ok = Schema.Value.Check(SlugSchema.FileContent.Index, res.data);
  if (!ok) {
    const errors = [...Schema.Value.Errors(SlugSchema.FileContent.Index, res.data)];
    const reason = formatSchemaReason(errors);
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Slug-file-content index failed @sys/schema validation. Reason: ${reason}`,
      },
    };
  }

  const manifest = res.data as t.SlugFileContentIndex;
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
  const contentBaseUrl = options?.contentBaseUrl ?? baseUrl;
  const contentDir = options?.layout?.contentDir ?? 'json';
  const url = ClientUrl.content({
    baseUrl: contentBaseUrl,
    contentDir,
    filename: SlugUrl.fileContentFilename(hash),
  });
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

  const ok = Schema.Value.Check(SlugSchema.FileContent.Props, res.data);
  if (!ok) {
    const errors = [...Schema.Value.Errors(SlugSchema.FileContent.Props, res.data)];
    const reason = formatSchemaReason(errors);
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Slug-file-content payload failed @sys/schema validation. Reason: ${reason}`,
      },
    };
  }

  return { ok: true, value: res.data as t.SlugFileContentDoc };
}
