import type { DebugSignals } from './-SPEC.Debug.tsx';

import React from 'react';
import { usePlayControlsProps } from '../use.PlayControlsProps.ts';
import { type t, Player } from './common.ts';

type PlayControlsProps = {
  debug?: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const PlayControls: React.FC<PlayControlsProps> = (props) => {
  const { debug } = props;
  const p = debug?.props;

  const controller = p?.controller.value;
  const snapshot = p?.snapshot.value;
  const decks = debug?.decks;

  const controls = usePlayControlsProps({ controller, snapshot, decks });
  return (
    <Player.Video.Controls.UI
      {...controls}
      theme={props.theme}
      style={props.style}
      maskOpacity={0}
      background={{ rounded: 6, opacity: 0.4, shadow: false }}
      padding={15}
      margin={[10, 0, 20, 0]}
    />
  );
};
