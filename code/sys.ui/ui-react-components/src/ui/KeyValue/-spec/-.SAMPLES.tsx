import { type t, Color, Str } from '../common.ts';
import { Foo } from './-ui.Foo.tsx';
import { Bullet } from '../../Bullet/mod.ts';

export type SampleKind = 'comprehensive' | 'simple' | 'opacity';

/**
 * Sample data-sets:
 */
export const SAMPLE = {
  items(sample?: SampleKind): t.KeyValueItem[] | undefined {
    if (sample === 'comprehensive') return comprehensive();
    if (sample === 'simple') return simple();
    if (sample === 'opacity') return opacity();
    return undefined;
  },
} as const;

function simple(): t.KeyValueItem[] {
  return [
    { kind: 'title', v: 'Video Stream' },
    { kind: 'row', k: 'id', v: 'f3e1c4a9-278b-44e9-9b71-23e2e3a16c8b' },
    { kind: 'row', k: 'resolution', v: '1920×1080' },
    { kind: 'row', k: 'fps', v: '60' },
    { kind: 'row', k: 'device', v: 'Logitech BRIO 4K' },
  ];
}

function comprehensive(): t.KeyValueItem[] {
  return [
    { kind: 'title', v: 'Video Stream' },
    { kind: 'row', k: 'id', v: 'f3e1c4a9-278b-44e9-9b71-23e2e3a16c8b' },
    { kind: 'row', k: 'resolution', v: '1920×1080' },
    { kind: 'row', k: 'fps', v: '60' },
    { kind: 'row', k: 'device', v: 'Logitech BRIO 4K' },

    { kind: 'hr' },

    { kind: 'title', v: ['Audio Input', 'Right Aligned Title'] },
    { k: 'label', v: 'Yeti Nano', x: 10 },
    { k: 'sampleRate', v: '48000 Hz', x: 10 },
    { k: 'channels', v: '2', y: [6, 5], x: 10 },

    { kind: 'spacer', size: 8 },

    { kind: 'title', v: <Foo />, x: -15, y: [20, 8] },
    { k: 'boolean', v: true ? 'true' : 'false', mono: true },
    { k: 'truncate', v: 'Yes', mono: true },
    { k: 'columns.gap', v: '12 px', mono: true },

    { kind: 'hr', x: 20, y: [20, 5], thickness: 3 },

    { k: 'key for long value →', v: Str.lorem },
    { k: Str.lorem, v: '← value for long key' },
    {
      k: 'status',
      v: <Bullet selected={true} filled={true} selectedColor={Color.GREEN} />,
    },

    { kind: 'hr', y: [25, 10] },
    { k: 'theme', v: 'Dark' },
    { k: 'element', v: <Foo /> },
  ];
}

function opacity(): t.KeyValueItem[] {
  const x = [15, 0] as const;
  return [
    { kind: 'title', v: 'Opacity Variants' },
    { kind: 'row', k: 'default', v: 'Hello, world', x },
    { kind: 'row', k: 'uniform opacity', v: '0.3', opacity: 0.3, x },
    { kind: 'row', k: 'key opacity 1', v: 'hello', opacity: { k: 1 }, x },
    { kind: 'row', k: 'value opacity 0.5', v: '👋', opacity: { v: 0.5 }, x },
  ];
}
