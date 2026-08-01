import type { t } from './common.ts';
import { D, Schema, SlugSchema, SlugUrl } from './common.ts';
import { fetchJson } from './u.fetch.ts';
import { formatSchemaReason } from './u.schema.ts';

export const Descriptor: t.SlugClientDescriptorLoadLib = {
  load,
};

async function load(
  origin: t.StringUrl,
  manifests: t.StringPath,
  transport: t.SlugLoadTransport,
): Promise<t.SlugClientResult<t.BundleDescriptorDoc>> {
  const url = SlugUrl.Composition.descriptor({ origin, manifests, filename: 'dist.client.json' });
  const req: t.HttpFetch.Init = { ...D.CACHE_INIT };
  req.cache = D.CACHE_INIT.cache;

  const res = await fetchJson<unknown>(url, req, transport);
  if (!res.ok) {
    return {
      ok: false,
      error: {
        kind: 'http',
        message: `dist.client.json fetch failed. ${res.status} ${res.statusText} @ ${
          res.url ?? url
        }`,
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
