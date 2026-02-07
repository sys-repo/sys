import { type t, BulletList } from './common.ts';

type Props = {
  kind: t.DescriptorMode;
  onKindChange?: (next: t.DescriptorMode) => void;
};

export function renderDescriptorCard(e: t.ActionProbe.ProbeRenderArgs<t.TEnv, t.DescriptorParams>, props: Props) {
  const { kind } = props;

  e.element(
    <div>
      Loads <code>dist.client.json</code>, then runs kind-specific calls for filesystem or media
      descriptors.
    </div>,
  );

  e.element(
    <BulletList.UI
      selected={kind}
      items={[
        { id: 'descriptor', label: 'descriptor' },
        { id: 'slug-tree:fs', label: 'descriptor: content/file' },
        { id: 'slug-tree:media:seq', label: 'descriptor: playback/assets' },
      ]}
      onSelect={(ev) => {
        if (!isDescriptorMode(ev.id)) return;
        props.onKindChange?.(ev.id);
      }}
    />,
  );

  e.item({ k: 'kind', v: kind });
}

function isDescriptorKind(input: string): input is t.BundleDescriptorKind {
  return input === 'slug-tree:fs' || input === 'slug-tree:media:seq';
}

function isDescriptorMode(input: string): input is t.DescriptorMode {
  if (input === 'descriptor') return true;
  return isDescriptorKind(input);
}
