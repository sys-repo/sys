import { type t, D, HttpOriginBase } from './common.ts';

export const HttpOrigin: t.FC<t.HttpOrigin.Props> = (props) => {
  return (
    <HttpOriginBase.UI.Controlled
      env={props.env}
      origin={props.origin}
      spec={props.spec ?? D.spec}
      debug={props.debug}
      theme={props.theme}
      style={props.style}
    />
  );
};
