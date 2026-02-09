import React from 'react';
import { type t, BulletList, SlugLoader } from './common.ts';

type Props = {
  origin: t.SlugUrlOrigin;
  kind: t.DescriptorMode;
  onKindChange?: (next: t.DescriptorMode) => void;
};

export function renderDescriptorCard(
  e: t.ActionProbe.ProbeRenderArgs<t.TEnv, t.DescriptorParams>,
  props: Props,
) {
  const { kind } = props;

  e.element(
    <div>
      Loads <code>dist.client.json</code>, then runs kind-specific calls for filesystem or media
      descriptors.
    </div>,
  );

  e.element(<KindSelector origin={props.origin} selected={kind} onChange={props.onKindChange} />);
  e.hr();
  e.item({ k: 'kind', v: kind });
}

type SelectorProps = {
  origin: t.SlugUrlOrigin;
  selected: t.DescriptorMode;
  onChange?: (next: t.DescriptorMode) => void;
};

function KindSelector(props: SelectorProps) {
  const [items, setItems] = React.useState<t.BulletList.Item[]>(fallbackItems());

  React.useEffect(() => {
    let disposed = false;
    void loadItems(props.origin.cdn.default).then((next) => {
      if (disposed) return;
      setItems(next);
    });
    return () => {
      disposed = true;
    };
  }, [props.origin.cdn.default]);

  return (
    <BulletList.UI
      selected={props.selected}
      items={items}
      onSelect={(ev) => {
        if (!isDescriptorMode(ev.id)) return;
        props.onChange?.(ev.id);
      }}
    />
  );
}

function isDescriptorMode(input: string): input is t.DescriptorMode {
  return input === 'slug-tree:fs' || input === 'slug-tree:media:seq';
}

async function loadItems(origin: string): Promise<t.BulletList.Item[]> {
  const discovered = await SlugLoader.Descriptor.kindsFromDist(origin);
  const ids = discovered.ok ? discovered.value : [];
  const fallback = SlugLoader.Descriptor.kinds();
  const selected = ids.length > 0 ? ids : fallback;
  return selected.map((id) => ({ id, label: labelForKind(id) }));
}

function fallbackItems(): t.BulletList.Item[] {
  return SlugLoader.Descriptor.kinds().map((id) => ({ id, label: labelForKind(id) }));
}

function labelForKind(kind: t.BundleDescriptorKind): string {
  if (kind === 'slug-tree:fs') return 'descriptor: content/file';
  if (kind === 'slug-tree:media:seq') return 'descriptor: playback/assets';
  return `descriptor: ${kind}`;
}
