import React from 'react';
import { type t, KeyValue, Str } from './common.ts';
import { Data } from './m.Data.ts';

export type InfoProps = {
  env: t.HttpOriginEnv;
  origin?: t.UrlTree;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Info: React.FC<InfoProps> = (props) => {
  const { env, origin } = props;

  /**
   * KeyValue items:
   */
  const mono = true;
  const items: t.KeyValueItem[] = [];
  if (origin) {
    items.push({ kind: 'title', v: `HTTP Origin` });
    Data.flatten(origin).forEach((row) => {
      items.push({ k: row.key, v: Str.trimHttpScheme(row.url), mono });
    });
  }

  /**
   * Render:
   */

  return <KeyValue.UI theme={props.theme} items={items} layout={{ kind: 'table' }} />;
};
