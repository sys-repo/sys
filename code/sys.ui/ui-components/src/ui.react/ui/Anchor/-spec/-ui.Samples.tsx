import type React from 'react';
import { BulletList } from '../../BulletList/mod.ts';
import { Color, css, Is, type t } from './common.ts';

export type SamplesProps = {
  debug: t.DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
type Sample = {
  id: string;
  label: string;
  next:
    & Pick<
      t.DebugValues,
      'href' | 'enabled' | 'target' | 'truncate' | 'maxWidth' | 'children' | 'link'
    >
    & { download?: boolean };
};

export const EXAMPLE_URL = 'https://example.com';
export const EXAMPLE_LONG_LABEL =
  'Example website with a longer descriptive label for testing truncation';

const samples: readonly Sample[] = [
  {
    id: 'default',
    label: 'sample: default link',
    next: {
      href: EXAMPLE_URL,
      enabled: true,
      target: undefined,
      download: false,
      children: EXAMPLE_URL,
    },
  },
  {
    id: 'truncated',
    label: 'sample: truncated link',
    next: {
      href: EXAMPLE_URL,
      children: EXAMPLE_LONG_LABEL,
      truncate: true,
      maxWidth: 120,
    },
  },
  {
    id: 'new-tab',
    label: 'sample: new tab',
    next: {
      href: EXAMPLE_URL,
      enabled: true,
      target: '_blank',
      download: false,
      children: 'opens in new tab',
    },
  },
  {
    id: 'arrow-self',
    label: 'sample: arrow →',
    next: { href: EXAMPLE_URL, children: 'Example website', link: { openIn: 'self' } },
  },
  {
    id: 'arrow-new-tab',
    label: 'sample: arrow ↗ (new tab)',
    next: { href: EXAMPLE_URL, children: 'Example website', link: { openIn: 'new-tab' } },
  },
  {
    id: 'globe-self',
    label: 'sample: globe + →',
    next: {
      href: EXAMPLE_URL,
      children: 'Example website',
      link: { resource: 'web', openIn: 'self' },
    },
  },
  {
    id: 'globe-new-tab',
    label: 'sample: globe + ↗ (new tab)',
    next: {
      href: EXAMPLE_URL,
      children: 'Example website',
      link: { resource: 'web', openIn: 'new-tab' },
    },
  },
  {
    id: 'download',
    label: 'sample: download (/dist.json)',
    next: {
      href: '/dist.json',
      enabled: true,
      target: undefined,
      download: true,
      children: 'download dist.json',
    },
  },
  {
    id: 'disabled',
    label: 'sample: disabled link',
    next: {
      href: EXAMPLE_URL,
      enabled: false,
      target: '_blank',
      download: false,
      children: 'disabled link',
    },
  },
  {
    id: 'text-only',
    label: 'sample: text-only (no href)',
    next: {
      href: undefined,
      enabled: true,
      target: undefined,
      download: false,
      children: 'plain text (passthrough)',
    },
  },
  {
    id: 'empty',
    label: 'sample: empty child',
    next: {
      href: undefined,
      enabled: true,
      target: undefined,
      download: false,
      children: undefined,
    },
  },
];

/** Presets apply partial patches; later knob edits never imply a selected sample. */
export const Samples: React.FC<SamplesProps> = (props) => {
  const p = props.debug.props;
  const theme = Color.theme(props.theme);
  const styles = { base: css({ color: theme.fg }) };

  return (
    <div className={css(styles.base, props.style).class}>
      <BulletList.UI
        theme={theme.name}
        items={samples.map(({ id, label }) => ({ id, label }))}
        onActivate={({ id }) => {
          const sample = samples.find((sample) => sample.id === id);
          if (Is.nil(sample)) return;
          const { next } = sample;
          p.href.value = next.href;
          p.enabled.value = next.enabled ?? true;
          p.target.value = next.target;
          p.download.value = next.download ?? false;
          p.truncate.value = next.truncate ?? p.truncate.value;
          p.maxWidth.value = next.maxWidth ?? p.maxWidth.value;
          p.children.value = next.children;
          p.link.value = next.link;
          p.examples.value = 'none';
        }}
      />
    </div>
  );
};
