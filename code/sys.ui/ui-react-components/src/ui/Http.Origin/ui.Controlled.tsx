import React from 'react';
import { type t } from './common.ts';
import { useControlledView } from './u.controller.ts';
import { Uncontrolled } from './ui.tsx';

/**
 * Component:
 */
export const Controlled: React.FC<t.HttpOrigin.ControlledProps> = (props) => {
  const { origin, env, spec, verify } = props;
  const view = useControlledView({ origin, env, props: { spec } });

  /**
   * Render:
   */
  return (
    <Uncontrolled
      //
      debug={props.debug}
      style={props.style}
      theme={props.theme}
      verify={verify}
      {...view}
      spec={spec}
    />
  );
};
