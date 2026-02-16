import { type t, SlugClient, Url } from './common.ts';
import { TARGETS } from './m.Descriptor.TARGETS.ts';
import { Origin } from './m.Origin.ts';
import { withVideoShardRewrite } from './u.withVideoShardRewrite.ts';

type TCreate = t.SlugClientLoaderDescriptorLib['create'];

const create: TCreate = (target) => {
  const api: t.SlugClientLoaderDescriptor = {
    kinds,
    kindsFromDist,
    target: resolveTarget,
    load,
    docids,
    client,
  };
  return api;

  function kinds(): t.BundleDescriptorKind[] {
    return [target.kind];
  }

  function resolveTarget(
    kind: t.BundleDescriptorKind,
  ): t.SlugClientResult<t.SlugClientLoaderDescriptorTarget> {
    if (kind === target.kind) return { ok: true, value: target };
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Descriptor kind mismatch. target.kind=${target.kind}, kind=${kind}`,
      },
    };
  }

  async function kindsFromDist(
    origin: t.StringUrl,
  ): Promise<t.SlugClientResult<t.BundleDescriptorKind[]>> {
    const loaded = await load(origin, target.kind);
    if (!loaded.ok) return { ok: true, value: [target.kind] };
    const kinds = loaded.value.bundles.map((item) => item.kind).filter((item, i, all) => all.indexOf(item) === i);
    return { ok: true, value: kinds.length > 0 ? kinds : [target.kind] };
  }

  async function load(
    origin: t.StringUrl,
    kind: t.BundleDescriptorKind,
  ): Promise<t.SlugClientResult<t.BundleDescriptorDoc>> {
    const resolved = resolveTarget(kind);
    if (!resolved.ok) return resolved;
    return SlugClient.FromEndpoint.Descriptor.load(origin, resolved.value.descriptorPath);
  }

  async function docids(
    origin: t.StringUrl,
    kind: t.BundleDescriptorKind,
  ): Promise<t.SlugClientResult<t.StringId[]>> {
    const descriptor = await load(origin, kind);
    if (!descriptor.ok) return descriptor;

    const value = descriptor.value.bundles
      .filter((item) => item.kind === kind)
      .map((item) => item.docid)
      .filter((item, index, all) => all.indexOf(item) === index);

    return { ok: true, value };
  }

  async function client(
    args: t.SlugClientLoaderDescriptorClientArgs,
  ): Promise<t.SlugClientResult<t.SlugClientDescriptor>> {
    const resolved = resolveTarget(args.kind);
    if (!resolved.ok) return resolved;

    const origin = Origin.parse(args.origin);
    const descriptor = await SlugClient.FromEndpoint.Descriptor.load(
      origin.cdn.default,
      resolved.value.descriptorPath,
    );
    if (!descriptor.ok) return descriptor;

    const docid = args.docid ?? firstDocid(descriptor.value, resolved.value.kind);
    const selected = SlugClient.FromDescriptor.select({
      descriptor: descriptor.value,
      kind: resolved.value.kind,
      docid,
    });
    if (!selected.ok) return selected;

    const client = SlugClient.FromDescriptor.make({
      descriptor: descriptor.value,
      baseUrl: Url.parse(origin.cdn.default).join(resolved.value.basePath),
      kind: selected.value.kind,
      docid: selected.value.docid,
    });
    if (!client.ok) return client;

    return { ok: true, value: withVideoShardRewrite(client.value, origin) };
  }
};

export const DescriptorFactory: t.SlugClientLoaderDescriptorLib = {
  create,
};

/**
 * Transitional compatibility surface.
 * Keeps the existing singleton API until app seams move to explicit descriptor instances.
 */
export const Descriptor: t.SlugClientLoaderDescriptor = createComposite(TARGETS);

function createComposite(targets: readonly t.SlugClientLoaderDescriptorTarget[]): t.SlugClientLoaderDescriptor {
  const byKind = new Map<t.BundleDescriptorKind, t.SlugClientLoaderDescriptor>();
  for (const target of targets) {
    if (!byKind.has(target.kind)) byKind.set(target.kind, create(target));
  }

  const kinds = (): t.BundleDescriptorKind[] => [...byKind.keys()];
  const resolve = (kind: t.BundleDescriptorKind): t.SlugClientResult<t.SlugClientLoaderDescriptor> => {
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
        kinds().map(async (kind) => ({ kind, result: await byKind.get(kind)!.load(origin, kind) })),
      );
      const value = loaded
        .flatMap(({ kind, result }) => (result.ok ? result.value.bundles.map((item) => item.kind) : [kind]))
        .filter((item, index, all) => all.indexOf(item) === index);
      return { ok: true, value };
    },
    target(kind) {
      const descriptor = resolve(kind);
      if (!descriptor.ok) return descriptor;
      return descriptor.value.target(kind);
    },
    load(origin, kind) {
      const descriptor = resolve(kind);
      if (!descriptor.ok) return Promise.resolve(descriptor);
      return descriptor.value.load(origin, kind);
    },
    docids(origin, kind) {
      const descriptor = resolve(kind);
      if (!descriptor.ok) return Promise.resolve(descriptor);
      return descriptor.value.docids(origin, kind);
    },
    client(args) {
      const descriptor = resolve(args.kind);
      if (!descriptor.ok) return Promise.resolve(descriptor);
      return descriptor.value.client(args);
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
