import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, D, KeyValue, Rx, Signal, Str, Url } from '../common.ts';

type P = InfoPanelProps;

export type InfoPanelProps = {
  src?: t.StringUrl;
  bytes?: number;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const InfoPanel: React.FC<P> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  const items = wrangle.items(props);

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI theme={theme.name} layout={{ kind: 'table', columnGap: 20 }} items={items} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  items(props: P) {
    const { bytes = 0 } = props;
    const src = Url.parse(props.src);
    const url = src.toURL();
    const size = bytes === 0 ? '-' : Str.bytes(bytes);
    const path = url.pathname;
    const hash = wrangle.hashParts(path);

    const MAX = 50;
    const fmtPath =
      path.length < MAX ? path : `${path.slice(0, MAX / 2)} .. ${path.slice(-(MAX / 2))}`;

    const res: t.KeyValueItem[] = [
      { kind: 'title', v: D.name },
      { k: 'namespace', v: D.displayName },
      { k: 'size / bytes', v: size },
      { k: 'host', v: url.host || '-' },
      { k: 'path', v: fmtPath },
    ];
    if (hash?.hx) {
      res.push({
        k: `hash( ${hash.algo} )`,
        v: `${hash.hx.slice(0, 10)} .. ${hash.hx.slice(-5)}`,
      });
    }

    return res;
  },

  /**
   * Extracts the hash (hex) from a URL if it matches the pattern `<algo>-<hash>`.
   */
  hash(href: string = '', algo: string = 'sha256') {
    const pattern = new RegExp(`${algo}-([A-Fa-f0-9]{64})`);
    const match = href.match(pattern);
    return match ? match[1] : '';
  },

  /**
   * Extracts `{ algo, hx }` if the URL contains a `<algo>-<hash>` pattern.
   */
  hashParts(href: string = '', algo: string = 'sha256') {
    const hx = wrangle.hash(href);
    return hx ? { algo, hx } : undefined;
  },
} as const;
