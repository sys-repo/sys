import React from 'react';
import { type t, KeyValue } from './common.ts';
import { Data } from './m.Data.ts';
import { Value } from './ui.Value.tsx';

export type InfoProps = {
  env: t.HttpOrigin.Env;
  origin?: t.UrlTree;
  verify?: t.HttpOrigin.Verify;
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
      items.push({
        k: row.key,
        v: <Value url={row.url} theme={props.theme} />,
        mono,
      });
    });
  }

  /**
   * Render:
   */

  return <KeyValue.UI theme={props.theme} items={items} layout={{ kind: 'table' }} />;
};
