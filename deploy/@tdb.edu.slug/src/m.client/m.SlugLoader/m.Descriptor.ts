import { type t, SlugClient, Url } from './common.ts';
import { TARGETS } from './m.Descriptor.TARGETS.ts';
import { Origin } from './m.Origin.ts';
import { withVideoShardRewrite } from './u.withVideoShardRewrite.ts';

type TCreate = t.SlugClientLoaderDescriptorLib['create'];

const create: TCreate = (args) => {
  const state = buildState(args);
  const api: t.SlugClientLoaderDescriptor = {
    kinds,
    kindsFromDist,
    targets,
    targetById,
    target,
    load,
    docids,
    client,
  };
  return api;

  function kinds(): t.BundleDescriptorKind[] {
    return [...state.byKind.keys()];
  }

  function targets(): readonly t.SlugClientLoaderDescriptorTarget[] {
    return state.targets;
  }

  function targetById(id: t.StringId): t.SlugClientResult<t.SlugClientLoaderDescriptorTarget> {
    const target = state.byId.get(id);
    if (target) return { ok: true, value: target };
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `No deploy descriptor target for id: ${id}`,
      },
    };
  }

  function target(
    kind: t.BundleDescriptorKind,
  ): t.SlugClientResult<t.SlugClientLoaderDescriptorTarget> {
    const targetId = state.defaultByKind.get(kind);
    if (!targetId) {
      return {
        ok: false,
        error: {
          kind: 'schema',
          message: `No default deploy descriptor target for kind: ${kind}`,
        },
      };
    }
    return targetById(targetId);
  }

  async function kindsFromDist(
    origin: t.StringUrl,
  ): Promise<t.SlugClientResult<t.BundleDescriptorKind[]>> {
    const loaded = await Promise.all(
      kinds().map(async (kind) => ({ kind, result: await load(origin, kind) })),
    );
    const value = loaded
      .flatMap(({ kind, result }) =>
        result.ok ? result.value.bundles.map((item) => item.kind) : [kind],
      )
      .filter((item, index, all) => all.indexOf(item) === index);
    return { ok: true, value };
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
    const origin = Origin.parse(args.origin);
    const resolvedTarget = resolveTargetFromClientArgs(args);
    if (!resolvedTarget.ok) return resolvedTarget;
    const deployTarget = resolvedTarget.value;

    const descriptor = await SlugClient.FromEndpoint.Descriptor.load(
      origin.cdn.default,
      deployTarget.descriptorPath,
    );
    if (!descriptor.ok) return descriptor;

    const docid = args.docid ?? firstDocid(descriptor.value, deployTarget.kind);
    const selected = SlugClient.FromDescriptor.select({
      descriptor: descriptor.value,
      kind: deployTarget.kind,
      docid,
    });
    if (!selected.ok) return selected;

    const client = SlugClient.FromDescriptor.make({
      descriptor: descriptor.value,
      baseUrl: Url.parse(origin.cdn.default).join(deployTarget.basePath),
      kind: selected.value.kind,
      docid: selected.value.docid,
    });
    if (!client.ok) return client;

    return { ok: true, value: withVideoShardRewrite(client.value, origin) };
  }

  function resolveTargetFromClientArgs(
    args: t.SlugClientLoaderDescriptorClientArgs,
  ): t.SlugClientResult<t.SlugClientLoaderDescriptorTarget> {
    const byId = args.targetId ? targetById(args.targetId) : undefined;
    const byKind = args.kind ? target(args.kind) : undefined;

    if (byId && !byId.ok) return byId;
    if (byKind && !byKind.ok) return byKind;

    const resolved = byId?.value ?? byKind?.value;
    if (!resolved) {
      return {
        ok: false,
        error: {
          kind: 'schema',
          message: 'Descriptor client resolution requires either kind or targetId.',
        },
      };
    }

    if (args.kind && resolved.kind !== args.kind) {
      return {
        ok: false,
        error: {
          kind: 'schema',
          message: `Descriptor target/kind mismatch. target.kind=${resolved.kind}, kind=${args.kind}`,
        },
      };
    }

    return { ok: true, value: resolved };
  }
};

function firstDocid(
  descriptor: t.BundleDescriptorDoc,
  kind: t.BundleDescriptorKind,
): t.StringId | undefined {
  const match = descriptor.bundles.find((item) => item.kind === kind);
  return match?.docid;
}

function buildState(args: Parameters<TCreate>[0]) {
  const byId = new Map<t.StringId, t.SlugClientLoaderDescriptorTarget>();
  const byKind = new Map<t.BundleDescriptorKind, t.StringId[]>();
  const defaultByKind = new Map<t.BundleDescriptorKind, t.StringId>();

  for (const target of args.targets) {
    byId.set(target.id, target);
    const ids = byKind.get(target.kind) ?? [];
    ids.push(target.id);
    byKind.set(target.kind, ids);
  }

  for (const [kind, ids] of byKind) {
    const preferred = args.defaults?.[kind];
    defaultByKind.set(kind, preferred && ids.includes(preferred) ? preferred : ids[0]);
  }

  return {
    targets: [...args.targets],
    byId,
    byKind,
    defaultByKind,
  } as const;
}

export const DescriptorFactory: t.SlugClientLoaderDescriptorLib = {
  create,
};

export const Descriptor: t.SlugClientLoaderDescriptor = DescriptorFactory.create({
  targets: TARGETS,
});
