import { type t, SlugClient, Url } from './common.ts';
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

export const Descriptor: t.SlugLoaderDescriptorLib = {
  create,
};

function firstDocid(
  descriptor: t.BundleDescriptorDoc,
  kind: t.BundleDescriptorKind,
): t.StringId | undefined {
  const match = descriptor.bundles.find((item) => item.kind === kind);
  return match?.docid;
}
