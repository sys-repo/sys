import React from 'react';
import { type t, EffectController, PlaybackDriver, Player } from '../common.ts';

type PlayControlsProps = {
  controller?: t.SlugPlaybackController;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const PlayControls: React.FC<PlayControlsProps> = (props) => {
  const { controller } = props;

  /**
   * Hooks:
   */
  const state = EffectController.useEffectController(controller);
  const controls = PlaybackDriver.Util.usePlayControlsProps({
    controller: state?.timeline,
    snapshot: state?.snapshot,
    decks: state?.decks,
  });

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
