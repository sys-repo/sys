import React from 'react';
import { Player } from '../../Player/mod.ts';
import { type t } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

export type DeckControlsProps = {
  debug: DebugSignals;
  theme?: t.CommonTheme;
  padding?: t.CssEdgesInput;
  margin?: t.CssEdgesInput;
};

/**
 * Controls wired to the active deck.
 */
export const DeckControls: React.FC<DeckControlsProps> = (props) => {
  const { debug, theme } = props;
  const active = debug.props.active.value ?? 'A';
  const deck = debug.decks[active];
  const p = deck.props;

  // Local state to bridge async seek gap (video seek is not instant).
  const [pendingSeek, setPendingSeek] = React.useState<t.Secs | undefined>();
  const videoTime = p.currentTime.value ?? 0;

  // Clear pending seek once video catches up.
  React.useEffect(() => {
    if (pendingSeek !== undefined && Math.abs(videoTime - pendingSeek) < 0.5) {
      setPendingSeek(undefined);
    }
  }, [videoTime, pendingSeek]);

  // Clear pending seek when switching decks.
  React.useEffect(() => setPendingSeek(undefined), [active]);

  const handleClick: t.PlayerControlsButtonHandler = (e) => {
    if (e.button === 'Play') deck.is.playing ? deck.pause() : deck.play();
    if (e.button === 'Mute') p.muted.value = !p.muted.value;
  };

  const handleSeeking: t.PlayerControlSeekChangeHandler = (e) => {
    if (e.complete) {
      setPendingSeek(e.currentTime);
      deck.jumpTo(e.currentTime);
    }
  };

  return (
    <Player.Video.Controls.UI
      theme={theme}
      playing={p.playing.value}
      muted={p.muted.value}
      currentTime={pendingSeek ?? videoTime}
      duration={p.duration.value}
      buffering={p.buffering.value}
      onClick={handleClick}
      onSeeking={handleSeeking}
      maskOpacity={0}
      background={{ rounded: 6, opacity: 0.4, shadow: false }}
      padding={props.padding}
      margin={props.margin}
    />
  );
};
