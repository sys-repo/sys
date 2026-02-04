import React from 'react';
import { type t, Signal } from './common.ts';
import { createController } from './u.controller.ts';
import { Uncontrolled } from './ui.tsx';

/**
 * Component:
 */
export const Controlled: React.FC<t.HttpOriginControlledProps> = (props) => {
  const { origin, env, spec } = props;
  const ref = React.useRef<t.HttpOriginController>(null);

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => ref?.current?.listen());
  React.useEffect(() => {
    const controller = createController({ origin, env, props: { spec } });
    ref.current = controller;
    return () => controller.dispose();
  }, [origin, env]);

  /**
   * Render:
   */
  return (
    <Uncontrolled
      //
      debug={props.debug}
      style={props.style}
      theme={props.theme}
      spec={spec}
      {...ref.current?.view()}
    />
  );
};
