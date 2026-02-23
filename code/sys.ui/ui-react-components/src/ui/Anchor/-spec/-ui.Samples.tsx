import React from 'react';
import { Button } from '../../u.ts';
import { Color, css, type t } from './common.ts';

export type SamplesProps = {
  debug: t.DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
type P = SamplesProps;

/**
 * Component:
 */
export const Samples: React.FC<P> = (props) => {
  const p = props.debug.props;
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
  };

  const sample = (label: string, next: { href?: string; target?: t.Anchor.Target; download?: boolean; children?: string }) => {
    return (
      <Button
        block
        label={label}
        onClick={() => {
          p.href.value = next.href;
          p.target.value = next.target;
          p.download.value = next.download ?? false;
          p.children.value = next.children;
        }}
      />
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {sample('sample: default link', {
        href: 'https://example.com',
        target: undefined,
        download: false,
        children: 'https://example.com',
      })}
      {sample('sample: new tab', {
        href: 'https://example.com',
        target: '_blank',
        download: false,
        children: 'opens in new tab',
      })}
      {sample('sample: download', {
        href: 'https://example.com/file.txt',
        target: undefined,
        download: true,
        children: 'download file',
      })}
      {sample('sample: text-only (no href)', {
        href: undefined,
        target: undefined,
        download: false,
        children: 'plain text (passthrough)',
      })}
      {sample('sample: empty child', {
        href: undefined,
        target: undefined,
        download: false,
        children: undefined,
      })}
    </div>
  );
};
