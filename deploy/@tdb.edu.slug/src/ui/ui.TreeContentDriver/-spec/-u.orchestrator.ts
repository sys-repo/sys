import { TreeData } from '../../m.data/mod.ts';
import { TreeContentDriver } from '../mod.ts';
import { type t, Is, Signal, SlugLoader } from './common.ts';

type DataCardSignals = t.DataCardSignals;
type PropsSignals = {
  readonly origin: t.Signal<t.SlugUrlOrigin | undefined>;
  readonly cardKind: t.Signal<t.DataCardKind | undefined>;
};

export type SpecOrchestrator = t.TreeContentDriver.Orchestrator;

export function createOrchestrator(args: {
  props: PropsSignals;
  card: DataCardSignals;
}): SpecOrchestrator {
  const card = args.card.props;
  let lastResponse: unknown = undefined;
  let lastCardRef: string | undefined = card.treeContent.ref.value;

  const orchestrator = TreeContentDriver.createOrchestrator({
    load: async ({ request }) => {
      const kind = args.props.cardKind.value ?? 'file-content';
      const origin = args.props.origin.value?.cdn.default;
      if (!Is.str(origin) || origin.length === 0) throw new Error('Missing HTTP origin');

      if (kind === 'playback-content') {
        const client = await SlugLoader.Descriptor.client({
          origin,
          kind: 'slug-tree:media:seq',
          docid: request.key,
        });
        if (!client.ok) throw new Error(client.error.message);

        const assets = await client.value.Timeline.Assets.load();
        if (!assets.ok) throw new Error(assets.error.message);
        const playback = await client.value.Timeline.Playback.load();
        if (!playback.ok) throw new Error(playback.error.message);

        return {
          kind,
          docid: request.key,
          assets: assets.value.assets,
          playback: playback.value,
        };
      }

      const client = await SlugLoader.Descriptor.client({
        origin,
        kind: 'slug-tree:fs',
      });
      if (!client.ok) throw new Error(client.error.message);

      const index = await client.value.FileContent.index();
      if (!index.ok) throw new Error(index.error.message);

      const hash = findHash(index.value.entries, request.key);
      if (!hash) throw new Error(`No content hash found for ref: ${request.key}`);

      const file = await client.value.FileContent.get(hash);
      if (!file.ok) throw new Error(file.error.message);

      return {
        kind,
        docid: client.value.docid,
        ref: request.key,
        hash,
        contentType: file.value.contentType,
        content: file.value,
      };
    },
    onSelectedRefChange(ref) {
      if (card.treeContent.ref.value === ref) return;
      card.treeContent.ref.value = ref;
      lastCardRef = ref;
    },
  });

  Signal.effect(() => {
    if (orchestrator.disposed) return;
    const response = card.result.response.value;
    if (response === lastResponse) return;
    lastResponse = response;
    const tree = treeFromResponse(response);
    if (!tree) return;
    orchestrator.intent({ type: 'tree.set', tree });
    orchestrator.intent({ type: 'path.request', path: undefined });
    card.treeContent.ref.value = undefined;
    lastCardRef = undefined;
  });

  Signal.effect(() => {
    if (orchestrator.disposed) return;
    if (args.props.cardKind.value !== 'file-content') return;
    if (card.spinning.value) return;
    const ref = card.treeContent.ref.value;
    if (ref === lastCardRef) return;
    lastCardRef = ref;
    if (Is.str(ref) && ref.length > 0) {
      orchestrator.intent({ type: 'ref.request', ref });
    } else {
      orchestrator.intent({ type: 'path.request', path: undefined });
    }
  });

  return orchestrator;
}

function treeFromResponse(input: unknown): t.TreeHostViewNodeList | undefined {
  if (!Is.record(input)) return undefined;
  const value = Is.record(input.value) ? input.value : undefined;
  const tree = value && Is.record(value.tree) ? value.tree : undefined;
  if (!tree || !Array.isArray(tree.tree)) return undefined;
  return TreeData.fromSlugTree(tree as t.SlugTreeDoc);
}

function findHash(entries: readonly t.SlugFileContentEntry[], ref: string): string | undefined {
  const entry = entries.find((item) => item.frontmatter?.ref === ref || item.path === ref);
  return entry?.hash;
}
