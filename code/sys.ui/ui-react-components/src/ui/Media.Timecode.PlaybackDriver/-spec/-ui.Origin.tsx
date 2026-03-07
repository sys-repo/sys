import React from 'react';
import { type t, HttpOrigin } from './common.ts';
import { ORIGIN, type OriginEnv } from './-u.origin.ts';

type P = {
  readonly env?: OriginEnv;
  readonly theme?: t.CommonTheme;
  readonly style?: t.CssInput;
  readonly onChange?: (e: { readonly env: OriginEnv }) => void;
};

export const OriginPanel: React.FC<P> = (props) => {
  return (
    <HttpOrigin.UI.Uncontrolled
      theme={props.theme}
      style={props.style}
      env={props.env}
      spec={ORIGIN.SPEC}
      onChange={(e) => props.onChange?.({ env: e.next as OriginEnv })}
    />
  );
};

