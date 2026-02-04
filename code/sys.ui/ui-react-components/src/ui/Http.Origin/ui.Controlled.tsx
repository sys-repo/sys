import React from 'react';
import { type t, Signal } from './common.ts';
import { createController } from './u.controller.ts';
import { Uncontrolled } from './ui.tsx';

/**
 * Component:
 */
export const Controlled: React.FC<t.HttpOriginControlledProps> = (props) => {
  const { origin, defaults, kind } = props;
  const ref = React.useRef<t.HttpOriginController>(null);

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => ref?.current?.listen());
  React.useEffect(() => {
    const controller = createController({ origin, kind, props: { defaults } });
    ref.current = controller;
    return () => controller.dispose();
  }, [origin, kind]);

  /**
   * Render:
   */
  return (
    <Uncontrolled
      //
      debug={props.debug}
      style={props.style}
      theme={props.theme}
      {...ref.current?.view()}
    />
  );
};
