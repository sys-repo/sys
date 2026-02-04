import React from 'react';
import { type t, HttpOrigin } from './common.ts';
import { origins } from './u.origins.ts';

export const SlugHttpOrigin: React.FC<t.SlugHttpOriginProps> = (props) => {
  const { spec = origins } = props;
  return (
    <HttpOrigin.UI.Controlled
      theme={props.theme}
      style={props.style}
      env={props.env}
      origin={props.origin}
      spec={spec}
    />
  );
};
