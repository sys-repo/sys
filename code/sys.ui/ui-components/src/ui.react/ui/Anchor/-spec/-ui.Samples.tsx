import type React from 'react';
import { Color, css, D, Dev, type t } from './common.ts';

export type SamplesProps = {
  debug: t.DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
type Sample = Pick<t.Dev.List.Item, 'id' | 'label'> & {
  next:
    & Pick<
      t.DebugValues,
      'href' | 'enabled' | 'target' | 'mono' | 'truncate' | 'maxWidth' | 'children' | 'link'
    >
    & { download?: boolean };
};

export const EXAMPLE_URL = 'https://example.com';
export const EXAMPLE_LONG_LABEL =
  'Example website with a longer descriptive label for testing truncation';

const samples: readonly Sample[] = [
  {
    id: 'default',
    label: 'default link',
    next: {
      href: EXAMPLE_URL,
      enabled: true,
      target: undefined,
      download: false,
      mono: D.mono,
      children: EXAMPLE_URL,
    },
  },
  {
    id: 'mono',
    label: 'monospace link',
    next: { href: EXAMPLE_URL, children: EXAMPLE_URL, mono: true },
  },
  {
    id: 'truncated',
    label: 'truncated link',
    next: {
      href: EXAMPLE_URL,
      children: EXAMPLE_LONG_LABEL,
      truncate: true,
      maxWidth: 120,
    },
  },
  {
    id: 'new-tab',
    label: 'new tab',
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
    label: 'arrow →',
    next: { href: EXAMPLE_URL, children: 'Example website', link: { openIn: 'self' } },
  },
  {
    id: 'arrow-new-tab',
    label: 'arrow ↗ (new tab)',
    next: { href: EXAMPLE_URL, children: 'Example website', link: { openIn: 'new-tab' } },
  },
  {
    id: 'globe-self',
    label: 'globe + →',
    next: {
      href: EXAMPLE_URL,
      children: 'Example website',
      link: { resource: 'web', openIn: 'self' },
    },
  },
  {
    id: 'globe-new-tab',
    label: 'globe + ↗ (new tab)',
    next: {
      href: EXAMPLE_URL,
      children: 'Example website',
      link: { resource: 'web', openIn: 'new-tab' },
    },
  },
  {
    id: 'dev-link',
    label: 'Dev.Link (default)',
    next: {
      href: EXAMPLE_URL,
      children: 'Example website',
      link: { api: 'dev', resource: 'default' },
    },
  },
  {
    id: 'download',
    label: 'download (/dist.json)',
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
    label: 'disabled link',
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
    label: 'text-only (no href)',
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
    label: 'empty child',
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
  const items: readonly t.Dev.List.Item[] = samples.map(({ id, label, next }) => ({
    id,
    label,
    onActivate: () => {
      p.href.value = next.href;
      p.enabled.value = next.enabled ?? true;
      p.target.value = next.target;
      p.download.value = next.download ?? false;
      p.mono.value = next.mono ?? p.mono.value;
      p.truncate.value = next.truncate ?? p.truncate.value;
      p.maxWidth.value = next.maxWidth ?? p.maxWidth.value;
      p.children.value = next.children;
      p.link.value = next.link;
      p.examples.value = 'none';
    },
  }));

  return (
    <div className={css(styles.base, props.style).class}>
      <Dev.List theme={theme.name} columns={2} items={items} />
    </div>
  );
};
