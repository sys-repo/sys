import { type t, Bullet, Color, Str } from './common.ts';
import { Foo } from './-ui.Foo.tsx';

export type SampleKind = 'comprehensive' | 'simple' | 'opacity' | 'links';

const mono = true;

/**
 * Sample data-sets:
 */
export const SAMPLE = {
  items(sample?: SampleKind): t.KeyValueItem[] | undefined {
    if (sample === 'comprehensive') return comprehensive();
    if (sample === 'simple') return simple();
    if (sample === 'opacity') return opacity();
    if (sample === 'links') return links();
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
    { kind: 'row', k: 'id', v: 'crdt:2esGLgD5SoQkeucytmGeadm9cC7y', userSelect: 'text' },
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
    { k: 'truncate', v: 'Yes', mono },
    { k: 'columns.gap', v: '12 px', mono },

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
    { k: 'link', v: 'https://fs.db.team', mono, href: true },
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

function links(): t.KeyValueItem[] {
  return [
    { kind: 'title', v: 'Link Variants', y: [0, 10] },
    {
      kind: 'row',
      k: 'href: string',
      v: 'https://example.com/string',
      href: 'https://example.com/string',
    },
    {
      kind: 'row',
      k: 'href: true',
      v: 'https://example.com/infer',
      href: true,
      mono,
    },
    {
      kind: 'row',
      k: 'href: props-only',
      v: 'https://example.com/inline',
      href: { infer: true, open: 'inline' },
      mono,
    },
    {
      kind: 'row',
      k: 'display: trim-http',
      v: 'https://example.com/trim-me',
      href: { infer: true, display: 'trim-http' },
      mono,
    },
    {
      k: 'href: long',
      v: 'https://example.com/foo/bar/baz/long/long/long',
      href: true,
      mono,
    },
    {
      kind: 'row',
      k: 'href: { v: string }',
      v: 'value link',
      href: { v: 'https://example.com/right' },
    },
    {
      kind: 'row',
      k: 'https://example.com/key',
      v: 'href: { k: true }',
      href: { k: true },
    },
    {
      kind: 'row',
      k: 'left side link',
      v: 'right side link',
      href: {
        k: 'https://example.com/left',
        v: { href: 'https://example.com/right', open: 'inline' },
      },
    },
    { kind: 'hr', y: [16, 8] },
    { kind: 'title', v: 'Safety (unsafe href ignored)' },
    {
      kind: 'row',
      k: 'javascript: rejected',
      v: 'javascript:alert(1)',
      href: true,
    },
  ];
}
