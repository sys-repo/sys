import type React from 'react';
import { Color, css, Dev, type t } from './common.ts';

export type SamplesProps = {
  debug: t.DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
type P = SamplesProps;

export const EXAMPLE_URL = 'https://example.com';
export const EXAMPLE_LONG_LABEL =
  'Example website with a longer descriptive label for testing truncation';

/**
 * Component:
 */
export const Samples: React.FC<P> = (props) => {
  const p = props.debug.props;
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
  };

  function sample(
    label: string,
    next: {
      href?: string;
      enabled?: boolean;
      target?: t.Anchor.Target;
      download?: boolean;
      truncate?: boolean;
      maxWidth?: t.DebugValues['maxWidth'];
      children?: string;
      link?: t.DebugValues['link'];
    },
  ) {
    return (
      <Dev.Button
        block
        label={label}
        onClick={() => {
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
    );
  }

  return (
    <div className={css(styles.base, props.style).class}>
      {sample('sample: default link', {
        href: EXAMPLE_URL,
        enabled: true,
        target: undefined,
        download: false,
        children: EXAMPLE_URL,
      })}
      {sample('sample: truncated link', {
        href: EXAMPLE_URL,
        children: EXAMPLE_LONG_LABEL,
        truncate: true,
        maxWidth: 120,
      })}
      {sample('sample: new tab', {
        href: EXAMPLE_URL,
        enabled: true,
        target: '_blank',
        download: false,
        children: 'opens in new tab',
      })}
      {sample('sample: arrow →', {
        href: EXAMPLE_URL,
        children: 'Example website',
        link: { openIn: 'self' },
      })}
      {sample('sample: arrow ↗ (new tab)', {
        href: EXAMPLE_URL,
        children: 'Example website',
        link: { openIn: 'new-tab' },
      })}
      {sample('sample: globe + →', {
        href: EXAMPLE_URL,
        children: 'Example website',
        link: { resource: 'web', openIn: 'self' },
      })}
      {sample('sample: globe + ↗ (new tab)', {
        href: EXAMPLE_URL,
        children: 'Example website',
        link: { resource: 'web', openIn: 'new-tab' },
      })}
      {sample('sample: download (/dist.json)', {
        href: '/dist.json',
        enabled: true,
        target: undefined,
        download: true,
        children: 'download dist.json',
      })}
      {sample('sample: disabled link', {
        href: EXAMPLE_URL,
        enabled: false,
        target: '_blank',
        download: false,
        children: 'disabled link',
      })}
      {sample('sample: text-only (no href)', {
        href: undefined,
        enabled: true,
        target: undefined,
        download: false,
        children: 'plain text (passthrough)',
      })}
      {sample('sample: empty child', {
        href: undefined,
        enabled: true,
        target: undefined,
        download: false,
        children: undefined,
      })}
    </div>
  );
};
