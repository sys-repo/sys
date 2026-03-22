import React from 'react';
import { type t } from './common.ts';
import { useControlledView } from './u.controller.ts';
import { Uncontrolled } from './ui.tsx';

/**
 * Component:
 */
export const Controlled: React.FC<t.MyCtrlControlledProps> = (props) => {
  const { debug, theme } = props;
  const view = useControlledView({ debug, theme });

  /**
   * Render:
   */
  return <Uncontrolled style={props.style} {...view} />;
};
