import React from 'react';

import { css, Str, type t, Url } from './common.ts';
import { LabelStyle } from './u.Style.ts';

export type EndpointLabelProps = {
  urls: t.Ary<string>;
  showProtocol?: boolean;
  appendTooltip?: string;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const EndpointLabel: React.FC<EndpointLabelProps> = (props) => {
  const { urls = [], showProtocol = false, appendTooltip } = props;
  if (urls.length === 0) return null;

  const parts = wrangle.parts(urls[0]);
  let tooltip = urls.length > 1 ? urls.reduce((acc, url) => acc + `\n${url}`, '').trim() : '';
  if (appendTooltip) tooltip += '\n' + appendTooltip;
  tooltip = Str.trimEdgeNewlines(tooltip);

  /**
   * Render:
   */
  const styles = {
    base: css(LabelStyle.base, {}),
    protocol: css(LabelStyle.dim, { marginRight: 2 }),
    endpoint: css({}),
    suffix: css(LabelStyle.dim, { marginLeft: 5 }),
  };

  return (
    <div className={css(styles.base, props.style).class} title={tooltip}>
      {showProtocol && <span className={styles.protocol.class}>{parts.protocol}</span>}
      <span className={styles.endpoint.class}>{parts.origin}</span>
      {urls.length > 1 && <span className={styles.suffix.class}>{`(+${urls.length - 1})`}</span>}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  parts(href: string) {
    const url = Url.parse(href).toURL();
    const protocol = `${url.protocol}//`;
    const origin = (url.host + url.pathname).replace(/\/+$/, '');
    return { protocol, origin } as const;
  },
} as const;
