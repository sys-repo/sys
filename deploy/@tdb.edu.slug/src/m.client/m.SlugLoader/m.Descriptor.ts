import { type t, SlugClient, Url } from './common.ts';

export const Descriptor: t.SlugClientLoaderDescriptorLib = {
  kinds,
  kindsFromDist,
  target,
  load,
  docids,
  client,
};

const TARGETS: Record<t.BundleDescriptorKind, t.SlugClientLoaderDescriptorTarget> = {
  'slug-tree:fs': {
    kind: 'slug-tree:fs',
    descriptorPath: 'kb/-manifests',
    basePath: 'kb/-manifests',
  },
  'slug-tree:media:seq': {
    kind: 'slug-tree:media:seq',
    descriptorPath: 'program/-manifests',
    basePath: 'program',
  },
};

function kinds(): t.BundleDescriptorKind[] {
  return Object.keys(TARGETS) as t.BundleDescriptorKind[];
}

async function kindsFromDist(
  origin: t.StringUrl,
): Promise<t.SlugClientResult<t.BundleDescriptorKind[]>> {
  const loaded = await Promise.all(kinds().map(async (kind) => ({ kind, result: await load(origin, kind) })));
  const value = loaded
    .flatMap(({ kind, result }) => (result.ok ? result.value.bundles.map((item) => item.kind) : [kind]))
    .filter((item, index, all) => all.indexOf(item) === index);
  return { ok: true, value };
}

function target(kind: t.BundleDescriptorKind): t.SlugClientResult<t.SlugClientLoaderDescriptorTarget> {
  const value = TARGETS[kind];
  if (value) return { ok: true, value };

  return {
    ok: false,
    error: {
      kind: 'schema',
      message: `No deploy descriptor target for kind: ${kind}`,
    },
  };
}

async function load(
  origin: t.StringUrl,
  kind: t.BundleDescriptorKind,
): Promise<t.SlugClientResult<t.BundleDescriptorDoc>> {
  const resolved = target(kind);
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
  const resolved = target(args.kind);
  if (!resolved.ok) return resolved;
  const descriptor = await SlugClient.FromEndpoint.Descriptor.load(
    args.origin,
    resolved.value.descriptorPath,
  );
  if (!descriptor.ok) return descriptor;

  // Deploy policy: absent explicit docid, select the first descriptor bundle for the kind.
  const docid = args.docid ?? firstDocid(descriptor.value, args.kind);
  const selected = SlugClient.FromDescriptor.select({
    descriptor: descriptor.value,
    kind: args.kind,
    docid,
  });
  if (!selected.ok) return selected;

  return SlugClient.FromDescriptor.make({
    descriptor: descriptor.value,
    baseUrl: Url.parse(args.origin).join(resolved.value.basePath),
    kind: selected.value.kind,
    docid: selected.value.docid,
  });
}

function firstDocid(
  descriptor: t.BundleDescriptorDoc,
  kind: t.BundleDescriptorKind,
): t.StringId | undefined {
  const match = descriptor.bundles.find((item) => item.kind === kind);
  return match?.docid;
}
