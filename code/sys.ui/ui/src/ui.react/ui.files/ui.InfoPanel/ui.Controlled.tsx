import React from 'react';
import { type t } from './common.ts';
import { useControlledView } from './u.controller.ts';
import { InfoPanel } from './ui.tsx';

/**
 * Render the controlled InfoPanel adapter backed by signal state.
 */
export const Controlled: React.FC<t.Files.InfoPanel.ControlledProps> = (props) => {
  const { debug, theme, snapshot, events } = props;
  const view = useControlledView({ debug, theme, snapshot, events });

  return (
    <InfoPanel
      title={props.title}
      fields={props.fields}
      transport={props.transport}
      animation={props.animation}
      style={props.style}
      {...view}
    />
  );
};
