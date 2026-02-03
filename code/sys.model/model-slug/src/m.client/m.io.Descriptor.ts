import type { t } from './common.ts';
import { D, Http, Schema, SlugSchema, Url } from './common.ts';
import { formatSchemaReason } from './u.schema.ts';

export const Descriptor: t.SlugClientDescriptorLoadLib = {
  load,
};

async function load(
  origin: t.StringUrl,
  manifests: t.StringPath,
): Promise<t.SlugClientResult<t.BundleDescriptorDoc>> {
  const fetch = Http.fetcher();
  const url = Url.parse(origin).join(manifests, 'dist.client.json');
  const req: RequestInit = { ...D.CACHE_INIT };
  req.cache = D.CACHE_INIT.cache;

  const res = await fetch.json<unknown>(url, req);
  if (!res.ok) {
    return {
      ok: false,
      error: {
        kind: 'http',
        message: `dist.client.json fetch failed. ${res.status} ${res.statusText} @ ${res.url ?? url}`,
        status: res.status,
        statusText: res.statusText,
        url: res.url ?? url,
      },
    };
  }

  const ok = Schema.Value.Check(SlugSchema.BundleDescriptor.Schema, res.data);
  if (!ok) {
    const errors = [...Schema.Value.Errors(SlugSchema.BundleDescriptor.Schema, res.data)];
    const reason = formatSchemaReason(errors);
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `dist.client.json failed @sys/schema validation. Reason: ${reason}`,
      },
    };
  }

  return { ok: true, value: res.data as t.BundleDescriptorDoc };
}
