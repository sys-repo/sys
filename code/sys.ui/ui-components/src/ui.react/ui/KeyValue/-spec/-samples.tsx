import { Bullet, Chip, Color, css, Str, type t } from './common.ts';
import { Foo } from './-ui.Foo.tsx';

export type SampleKind = 'comprehensive' | 'simple' | 'opacity' | 'links' | 'recursive' | 'reorder';

const mono = true;
const Styles = {
  nestedKey: css({ marginLeft: 20 }),
} as const;

/**
 * Sample data-sets.
 */
export const SAMPLE = {
  items(sample?: SampleKind): t.KeyValue.Item[] | undefined {
    if (sample === 'comprehensive') return withSampleIds(sample, comprehensive());
    if (sample === 'simple') return withSampleIds(sample, simple());
    if (sample === 'opacity') return withSampleIds(sample, opacity());
    if (sample === 'links') return withSampleIds(sample, links());
    if (sample === 'recursive') return withSampleIds(sample, recursive());
    if (sample === 'reorder') return withSampleIds(sample, reorder());
    return undefined;
  },
} as const;

/** Apply deterministic sample IDs so the reorder prop behaves uniformly in specs. */
function withSampleIds(sample: SampleKind, items: t.KeyValue.Item[]) {
  return items.map((item, index) => ({ ...item, id: item.id ?? `${sample}:${index}` }));
}

function simple(): t.KeyValue.Item[] {
  return [
    { kind: 'title', v: 'Video Stream' },
    { kind: 'row', k: 'id', v: 'f3e1c4a9-278b-44e9-9b71-23e2e3a16c8b' },
    { kind: 'row', k: 'resolution', v: '1920×1080' },
    { kind: 'row', k: 'fps', v: '60' },
    { kind: 'row', k: 'device', v: 'Logitech BRIO 4K' },
  ];
}

function comprehensive(): t.KeyValue.Item[] {
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
    { k: 'link', v: 'https://fs.db.team', mono, href: true },
    { k: 'theme', v: 'Dark' },
    { k: 'element', v: <Foo /> },
    { k: 'chip', v: <Chip.UI>1,234 dB</Chip.UI> },
  ];
}

function opacity(): t.KeyValue.Item[] {
  const x = [15, 0] as const;
  return [
    { kind: 'title', v: 'Opacity Variants' },
    { kind: 'row', k: 'default', v: 'Hello, world', x },
    { kind: 'row', k: 'uniform opacity', v: '0.3', opacity: 0.3, x },
    { kind: 'row', k: 'key opacity 1', v: 'hello', opacity: { k: 1 }, x },
    { kind: 'row', k: 'value opacity 0.5', v: '👋', opacity: { v: 0.5 }, x },
  ];
}

function recursive(): t.KeyValue.Item[] {
  return [
    { kind: 'title', v: 'Recursive Item Group' },
    { id: 'row:standalone-a', kind: 'row', k: 'standalone row A', v: 'independent' },
    {
      id: 'compound',
      kind: 'group',
      items: [
        { id: 'compound.primary', kind: 'row', k: 'group row', v: 'moves as one' },
        {
          id: 'compound.nested-1',
          kind: 'row',
          k: <span className={Styles.nestedKey.class}>{'nested row 1'}</span>,
          v: 'right flush',
        },
        {
          id: 'compound.nested-2',
          kind: 'row',
          k: <span className={Styles.nestedKey.class}>{'nested row 2'}</span>,
          v: 'right flush',
        },
      ],
    },
    { id: 'hr:outside-group', kind: 'hr', y: [8, 8] },
    { id: 'row:standalone-b', kind: 'row', k: 'standalone row B', v: 'independent' },
    { id: 'row:standalone-c', kind: 'row', k: 'standalone row C', v: 'independent' },
  ];
}

function reorder(): t.KeyValue.Item[] {
  return [
    { id: 'stream:title', kind: 'title', v: 'Reorder Sample' },
    { id: 'stream:id', kind: 'row', k: 'id', v: 'crdt:2esGLgD5SoQkeucytmGeadm9cC7y' },
    { id: 'stream:resolution', kind: 'row', k: 'resolution', v: '1920×1080' },
    { id: 'stream:fps', kind: 'row', k: 'fps', v: '60' },
    { id: 'stream:device', kind: 'row', k: 'device', v: 'Logitech BRIO 4K' },
    { id: 'stream:hr', kind: 'hr' },
    { id: 'stream:status', kind: 'row', k: 'status', v: 'active' },
  ];
}

function links(): t.KeyValue.Item[] {
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
      k: 'display: trim-http',
      v: 'https://example.com/trim-me',
      href: { infer: true, display: 'trim-http' },
    },
    { kind: 'hr', y: [15, 15] },
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
      mono,
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
    { kind: 'hr', y: [35, 5] },
    { kind: 'title', v: 'Safety (unsafe href ignored)' },
    {
      kind: 'row',
      k: 'javascript: rejected',
      v: 'javascript:alert(1)',
      href: true,
    },
  ];
}
