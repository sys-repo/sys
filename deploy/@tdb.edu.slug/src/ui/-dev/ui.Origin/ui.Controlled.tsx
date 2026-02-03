import React from 'react';
import { type t, Signal } from './common.ts';
import { createController } from './u.controller.ts';
import { Origin } from './ui.tsx';

/**
 * Component:
 */
export const OriginControlled: React.FC<t.DevOriginControlledProps> = (props) => {
  const { origin, defaults, kind } = props;
  const ref = React.useRef<t.DevOriginController>(null);

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
    <Origin
      //
      debug={props.debug}
      style={props.style}
      theme={props.theme}
      {...ref.current?.view()}
    />
  );
};
