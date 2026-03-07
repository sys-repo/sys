import React from 'react';
import { type t, PlaybackDriver, Player } from './common.ts';

type PlayControlsProps = {
  controller?: t.TimecodePlaybackDriver.TimelineController;
  snapshot?: t.TimecodeState.Playback.Snapshot;
  decks?: t.TimecodePlaybackDriver.VideoDecks;
  muted?: boolean;
  onMutedChange?: (next: boolean) => void;
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
  type ClickArg = Parameters<NonNullable<typeof controls.onClick>>[0];

  const onClick = React.useCallback(
    (e: ClickArg) => {
      if (e.button === 'Mute') {
        const next = !(props.muted ?? controls.muted ?? false);
        props.onMutedChange?.(next);
        return;
      }
      controls.onClick?.(e);
    },
    [props.muted, props.onMutedChange, controls],
  );

  return (
    <Player.Video.Controls.UI
      {...controls}
      muted={props.muted ?? controls.muted}
      onClick={onClick}
      theme={props.theme}
      style={props.style}
      maskOpacity={0}
      background={{ rounded: 6, opacity: 0.4, shadow: false }}
      padding={[8, 15]}
    />
  );
};
