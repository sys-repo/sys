import { type t, SlugClient, Url } from './common.ts';
import { renderDescriptorCard } from './-ui.descriptor.card.tsx';

type Params = t.DescriptorParams;

export const Descriptor: t.ActionProbe.ProbeSpec<t.TEnv, Params> = {
  title: 'Descriptor',
  render(e) {
    const path = 'kb/-manifests';
    const kind = e.descriptorKind ?? 'descriptor';
    e.params({ path, kind });
    renderDescriptorCard(e, { kind, onKindChange: e.onDescriptorKindChange });
    e.item({ k: 'path', v: path });
  },
  async run(e) {
    const params = e.params<Params>();
    const path = params?.path;
    const kind = params?.kind;
    if (!path || !kind) {
      e.item({ k: 'error', v: 'Missing params.path or params.kind' });
      return e.result({ ok: false, error: { message: 'Missing params.path or params.kind' } });
    }

    e.item({ k: 'origin', v: e.origin.cdn.default });
    e.item({ k: 'path', v: path });
    e.item({ k: 'kind', v: kind });

    const descriptor = await SlugClient.FromEndpoint.Descriptor.load(e.origin.cdn.default, path);
    if (kind === 'descriptor') {
      return e.result(descriptor);
    }
    if (!descriptor.ok) return e.result(descriptor);

    const client = SlugClient.FromDescriptor.make({
      descriptor: descriptor.value,
      baseUrl: Url.parse(e.origin.cdn.default).join(path),
      kind,
    });
    if (!client.ok) return e.result(client);

    if (kind === 'slug-tree:fs') {
      const tree = await client.value.Tree.load();
      if (!tree.ok) return e.result(tree);

      const content = await client.value.FileContent.index();
      if (!content.ok) return e.result(content);

      return e.result({
        ok: true,
        value: {
          kind,
          descriptor: descriptor.value,
          client: {
            docid: client.value.docid,
            baseUrl: client.value.baseUrl,
            layout: client.value.layout,
          },
          tree: tree.value,
          contentIndex: content.value,
        },
      });
    }

    const assets = await client.value.Timeline.Assets.load();
    if (!assets.ok) return e.result(assets);

    const playback = await client.value.Timeline.Playback.load();
    if (!playback.ok) return e.result(playback);

    const bundle = await client.value.Timeline.Bundle.load();
    if (!bundle.ok) return e.result(bundle);

    return e.result({
      ok: true,
      value: {
        kind,
        descriptor: descriptor.value,
        client: {
          docid: client.value.docid,
          baseUrl: client.value.baseUrl,
          layout: client.value.layout,
        },
        assets: assets.value,
        playback: playback.value,
        bundle: bundle.value,
      },
    });
  },
};
