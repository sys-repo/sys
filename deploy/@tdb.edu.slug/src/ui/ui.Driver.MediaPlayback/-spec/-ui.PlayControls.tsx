import React from 'react';
import { type t, PlaybackDriver, Player } from './common.ts';

type PlayControlsProps = {
  controller?: t.TimecodePlaybackDriver.TimelineController;
  snapshot?: t.TimecodeState.Playback.Snapshot;
  decks?: t.TimecodePlaybackDriver.VideoDecks;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const PlayControls: React.FC<PlayControlsProps> = (props) => {
  const controls = PlaybackDriver.Util.usePlayControlsProps({
    controller: props.controller,
    snapshot: props.snapshot,
    decks: props.decks,
  });

  return (
    <Player.Video.Controls.UI
      {...controls}
      theme={props.theme}
      style={props.style}
      maskOpacity={0}
      background={{ rounded: 6, opacity: 0.4, shadow: false }}
      padding={[8, 15]}
      margin={[10, 0, 20, 0]}
    />
  );
};

