import { type t, SlugClient, Url } from './common.ts';
import { TARGETS } from './m.Descriptor.TARGETS.ts';
import { Origin } from './m.Origin.ts';
import { withVideoShardRewrite } from './u.withVideoShardRewrite.ts';

const create: t.SlugLoaderDescriptorLib['create'] = (target) => {
  type T = t.SlugLoaderDescriptor;

  const kind: T['kind'] = target.kind;

  const resolveTarget: T['target'] = () => target;

  const load: T['load'] = async (origin) => {
    return SlugClient.FromEndpoint.Descriptor.load(origin, target.descriptorPath);
  };

  const docids: T['docids'] = async (origin) => {
    const descriptor = await load(origin);
    if (!descriptor.ok) return descriptor;

    const value = descriptor.value.bundles
      .filter((item) => item.kind === target.kind)
      .map((item) => item.docid)
      .filter((item, index, all) => all.indexOf(item) === index);

    return { ok: true, value };
  };

  const client: T['client'] = async (args) => {
    const origin = Origin.parse(args.origin);
    const descriptor = await SlugClient.FromEndpoint.Descriptor.load(
      origin.cdn.default,
      target.descriptorPath,
    );
    if (!descriptor.ok) return descriptor;

    const docid = args.docid ?? firstDocid(descriptor.value, target.kind);
    const selected = SlugClient.FromDescriptor.select({
      descriptor: descriptor.value,
      kind: target.kind,
      docid,
    });
    if (!selected.ok) return selected;

    const client = SlugClient.FromDescriptor.make({
      descriptor: descriptor.value,
      baseUrl: Url.parse(origin.cdn.default).join(target.basePath),
      kind: selected.value.kind,
      docid: selected.value.docid,
    });
    if (!client.ok) return client;

    return { ok: true, value: withVideoShardRewrite(client.value, origin) };
  };

  const api: t.SlugLoaderDescriptor = {
    kind,
    target: resolveTarget,
    load,
    docids,
    client,
  };

  return api;
};

export const DescriptorFactory: t.SlugLoaderDescriptorLib = {
  create,
};

/**
 * Transitional compatibility surface.
 * Keeps the existing singleton API until app seams move to explicit descriptor instances.
 */
export const Descriptor: t.SlugLoaderDescriptorCatalog = createComposite(TARGETS);

function createComposite(
  targets: readonly t.SlugLoaderDescriptorTarget[],
): t.SlugLoaderDescriptorCatalog {
  const byKind = new Map<t.BundleDescriptorKind, t.SlugLoaderDescriptor>();
  for (const target of targets) {
    if (!byKind.has(target.kind)) byKind.set(target.kind, create(target));
  }

  const kinds = (): t.BundleDescriptorKind[] => [...byKind.keys()];
  const resolve = (kind: t.BundleDescriptorKind): t.SlugClientResult<t.SlugLoaderDescriptor> => {
    const descriptor = byKind.get(kind);
    if (descriptor) return { ok: true, value: descriptor };
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `No deploy descriptor target for kind: ${kind}`,
      },
    };
  };

  return {
    kinds,
    async kindsFromDist(origin) {
      const loaded = await Promise.all(
        kinds().map(async (kind) => ({ kind, result: await byKind.get(kind)!.load(origin) })),
      );
      const value = loaded
        .flatMap(({ kind, result }) =>
          result.ok ? result.value.bundles.map((item) => item.kind) : [kind],
        )
        .filter((item, index, all) => all.indexOf(item) === index);
      return { ok: true, value };
    },
    target(kind) {
      const descriptor = resolve(kind);
      if (!descriptor.ok) return descriptor;
      return { ok: true, value: descriptor.value.target() };
    },
    load(origin, kind) {
      const descriptor = resolve(kind);
      if (!descriptor.ok) return Promise.resolve(descriptor);
      return descriptor.value.load(origin);
    },
    docids(origin, kind) {
      const descriptor = resolve(kind);
      if (!descriptor.ok) return Promise.resolve(descriptor);
      return descriptor.value.docids(origin);
    },
    client(args) {
      const descriptor = resolve(args.kind);
      if (!descriptor.ok) return Promise.resolve(descriptor);
      return descriptor.value.client({ origin: args.origin, docid: args.docid });
    },
  };
}

function firstDocid(
  descriptor: t.BundleDescriptorDoc,
  kind: t.BundleDescriptorKind,
): t.StringId | undefined {
  const match = descriptor.bundles.find((item) => item.kind === kind);
  return match?.docid;
}
