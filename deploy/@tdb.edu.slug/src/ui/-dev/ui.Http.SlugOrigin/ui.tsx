import React from 'react';
import { type t, HttpOrigin, D } from './common.ts';

export const SlugHttpOrigin: React.FC<t.SlugHttpOriginProps> = (props) => {
  const { spec = D.spec } = props;
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
