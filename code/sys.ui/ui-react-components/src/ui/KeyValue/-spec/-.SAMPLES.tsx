import { type t, Str } from '../common.ts';
import { Foo } from './-ui.Foo.tsx';

export type SampleKind = 'comprehensive' | 'simple';

/**
 * Sample data-sets:
 */
export const SAMPLE = {
  items(sample?: SampleKind): t.KeyValueItem[] | undefined {
    if (sample === 'comprehensive') return comprehensive;
    if (sample === 'simple') return simple;
    return undefined;
  },
} as const;

const simple: t.KeyValueItem[] = [
  { kind: 'title', v: 'Video Stream' },
  { kind: 'row', k: 'id', v: 'f3e1c4a9-278b-44e9-9b71-23e2e3a16c8b' },
  { kind: 'row', k: 'resolution', v: '1920×1080' },
  { kind: 'row', k: 'fps', v: '60' },
  { kind: 'row', k: 'device', v: 'Logitech BRIO 4K' },
];

const comprehensive: t.KeyValueItem[] = [
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
  { k: 'mono', v: true ? 'true' : 'false' },
  { k: 'truncate', v: 'true' },
  { k: 'columns.gap', v: '12 px' },

  { kind: 'hr', x: 20, y: [20, 5], thickness: 3 },

  { k: 'key for long value →', v: Str.lorem },
  { k: Str.lorem, v: '← value for long key' },

  { kind: 'hr', y: [25, 10] },
  { k: 'theme', v: 'Dark' },
  { k: 'element', v: <Foo /> },
];
