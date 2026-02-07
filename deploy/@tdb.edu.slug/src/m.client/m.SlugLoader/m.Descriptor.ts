import { type t, SlugClient, Url } from './common.ts';

export const Descriptor: t.SlugClientLoaderDescriptorLib = {
  target,
  load,
  client,
};

function target(kind: t.BundleDescriptorKind): t.SlugClientResult<t.SlugClientLoaderDescriptorTarget> {
  if (kind === 'slug-tree:fs') {
    return {
      ok: true,
      value: {
        kind,
        descriptorPath: 'kb/-manifests',
        basePath: 'kb/-manifests',
      },
    };
  }

  if (kind === 'slug-tree:media:seq') {
    return {
      ok: true,
      value: {
        kind,
        descriptorPath: 'program/-manifests',
        basePath: 'program',
      },
    };
  }

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
