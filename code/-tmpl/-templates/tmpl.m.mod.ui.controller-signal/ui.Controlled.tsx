import React from 'react';
import { type t, Signal } from './common.ts';
import { createController } from './u.controller.ts';
import { Uncontrolled } from './ui.tsx';

/**
 * Component:
 */
export const Controlled: React.FC<t.MyCtrlControlledProps> = (props) => {
  const { debug, theme } = props;
  const ref = React.useRef<t.MyCtrlController>(null);

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => ref?.current?.listen());
  React.useEffect(() => {
    ref.current = createController({ debug, theme });
    return () => ref.current?.dispose();
  }, [debug, theme]);

  /**
   * Render:
   */
  return <Uncontrolled style={props.style} {...ref.current?.view()} />;
};
