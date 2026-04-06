import { type t, D, HttpOriginBase } from './common.ts';

export const Controlled: t.FC<t.HttpOrigin.ControlledProps> = (props) => {
  return <HttpOriginBase.UI.Controlled {...props} spec={props.spec ?? D.spec} />;
};

export const Uncontrolled: t.FC<t.HttpOrigin.Props> = (props) => {
  return <HttpOriginBase.UI.Uncontrolled {...props} spec={props.spec ?? D.spec} />;
};
