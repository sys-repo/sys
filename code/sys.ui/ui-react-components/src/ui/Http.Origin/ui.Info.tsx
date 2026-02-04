import React from 'react';
import { type t, KeyValue, Str } from './common.ts';

export type InfoProps = {
  kind: t.HttpOriginEnv;
  origin: t.HttpOriginMap;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Info: React.FC<InfoProps> = (props) => {
  const { kind, origin } = props;

  /**
   * KeyValue items:
   */
  const mono = true;
  const items: t.KeyValueItem[] = [];
  if (kind === 'localhost') {
    items.push({ kind: 'title', v: 'Endpoint - HTTP Origin' });
    items.push({ k: 'app, cdn, cdn.video', v: Str.trimHttpScheme(origin.app), mono });
  } else {
    items.push({ kind: 'title', v: 'Endpoints (Origin)' });
    items.push({ k: 'app', v: Str.trimHttpScheme(origin.app), mono });
    items.push({ k: 'cdn', v: Str.trimHttpScheme(origin.cdn.default), mono });
    items.push({ k: 'cdn.video', v: Str.trimHttpScheme(origin.cdn.video), mono });
  }

  /**
   * Render:
   */

  return <KeyValue.UI theme={props.theme} items={items} />;
};
