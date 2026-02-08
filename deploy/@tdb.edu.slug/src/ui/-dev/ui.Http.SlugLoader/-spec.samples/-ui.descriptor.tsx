import { type t, SlugLoader } from './common.ts';
import { renderDescriptorCard } from './-ui.descriptor.card.tsx';

type Params = t.DescriptorParams;

export const Descriptor: t.ActionProbe.ProbeSpec<t.TEnv, Params> = {
  title: 'Descriptor',
  render(e) {
    const kind = e.probe?.descriptor?.kind ?? 'slug-tree:fs';
    const target = SlugLoader.Descriptor.target(kind);
    const descriptorPath = target.ok ? target.value.descriptorPath : '(unknown)';
    e.params({ kind });
    renderDescriptorCard(e, {
      origin: e.origin,
      kind,
      onKindChange: e.probe?.descriptor?.onKindChange,
    });
    e.item({ k: 'path', v: descriptorPath });
  },
  async run(e) {
    e.obj({ expand: { paths: ['$', '$.value'] } });

    const params = e.params<Params>();
    const kind = params?.kind;
    if (!kind) {
      e.item({ k: 'error', v: 'Missing params.kind' });
      return e.result({ ok: false, error: { message: 'Missing params.kind' } });
    }

    const target = SlugLoader.Descriptor.target(kind);
    if (!target.ok) return e.result(target);
    const path = target.value.descriptorPath;
    e.item({ k: 'origin', v: e.origin.cdn.default });
    e.item({ k: 'path', v: path });
    e.item({ k: 'kind', v: kind });

    const descriptor = await SlugLoader.Descriptor.load(e.origin.cdn.default, kind);
    if (!descriptor.ok) return e.result(descriptor);
    const selected = SlugLoader.Fetch.FromDescriptor.select({ descriptor: descriptor.value, kind });
    const docid = selected.ok ? selected.value.docid : undefined;
    e.item({ k: 'doc-id', v: docid ?? '(auto:none)' });
    const basePath = target.value.basePath;
    e.item({ k: 'base-path', v: basePath });

    const client = await SlugLoader.Descriptor.client({
      origin: e.origin.cdn.default,
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
        bundle: 'skipped (manifest-only proof)',
      },
    });
  },
};
