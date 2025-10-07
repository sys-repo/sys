import React from 'react';

import { type t, Url, css } from './common.ts';
import { LabelStyle } from './u.Style.ts';

export type EndpointLabelProps = {
  urls: string[];
  showProtocol?: boolean;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const EndpointLabel: React.FC<EndpointLabelProps> = (props) => {
  const { urls = [], showProtocol = false } = props;
  if (urls.length === 0) return null;

  const tooltip = urls.length > 1 ? urls.reduce((acc, url) => acc + `\n${url}`, '').trim() : '';
  const parts = wrangle.parts(urls[0]);

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
