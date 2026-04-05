import React from 'react';
import { type t, KeyValue } from './common.ts';
import { Data } from './m.Data.ts';
import { VerifyAction } from './ui.Action.Verify.tsx';
import { useVerify } from './use.Verify.ts';
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
  const rows = React.useMemo(() => (origin ? Data.flatten(origin) : []), [origin]);
  const verify = useVerify({ env, origin, rows, verify: props.verify });

  /**
   * KeyValue items:
   */
  const mono = true;
  const items: t.KeyValueItem[] = [];
  if (origin) {
    items.push({ kind: 'title', v: `HTTP Origin` });
    rows.forEach((row) => {
      items.push({
        k: row.key,
        v: (
          <Value
            url={row.url}
            theme={props.theme}
            status={verify.status[row.key]}
            reserveStatusSpace={verify.reserveStatusSpace}
          />
        ),
        mono,
      });
    });
    if (verify.verifyEnabled) {
      items.push({
        k: 'integrity',
        v: (
          <VerifyAction
            theme={props.theme}
            label={verify.actionLabel}
            running={verify.running}
            reserveStatusSpace={verify.reserveStatusSpace}
            onVerify={verify.onVerify}
          />
        ),
        mono,
      });
    }
  }

  /**
   * Render:
   */

  return <KeyValue.UI theme={props.theme} items={items} layout={{ kind: 'table' }} />;
};
