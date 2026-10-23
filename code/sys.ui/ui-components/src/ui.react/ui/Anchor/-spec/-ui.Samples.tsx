import React from 'react';
import { Button } from '../../u.ts';
import { Color, css, type t } from './common.ts';

export type SamplesProps = {
  debug: t.DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
type P = SamplesProps;

export const EXAMPLE_URL = 'https://example.com';

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
      children?: string;
    },
  ) {
    return (
      <Button
        block
        label={label}
        onClick={() => {
          p.href.value = next.href;
          p.enabled.value = next.enabled ?? true;
          p.target.value = next.target;
          p.download.value = next.download ?? false;
          p.children.value = next.children;
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
      {sample('sample: new tab', {
        href: EXAMPLE_URL,
        enabled: true,
        target: '_blank',
        download: false,
        children: 'opens in new tab',
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
