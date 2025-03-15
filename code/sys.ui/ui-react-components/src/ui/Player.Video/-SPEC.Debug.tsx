import React, { useState } from 'react';
import { type t, Color, css, Signal, Time } from './common.ts';

export type DebugProps = {
  ctx: { signals: t.VideoPlayerSignals };
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = DebugProps;

/**
 * Component
 */
export const Debug: React.FC<P> = (props) => {
  const { ctx } = props;
  const s = ctx.signals;
  const p = s.props;

  const [, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);

  Signal.useSignalEffect(() => {
    p.ready.value;
    p.loop.value;
    p.playing.value;
    p.fullscreenButton.value;
    Time.delay(redraw);
  });

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
      lineHeight: 1.6,
    }),
  };

  const div = (label: string, onClick: () => void) => {
    return <div onClick={onClick}>{label}</div>;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {div(`jumpTo(12, play)`, () => s.jumpTo(12))}
      {div(`jumpTo(12, paused)`, () => s.jumpTo(12, { play: false }))}
      <hr />
      {div(`play (toggle): ${p.playing}`, () => toggle(p.playing))}
      {div(`loop (toggle): ${p.loop}`, () => toggle(p.loop))}
      <hr />
      {div(`fullscreenButton (toggle): ${p.fullscreenButton}`, () => toggle(p.fullscreenButton))}
    </div>
  );
};

/**
 * Helpers
 */
const toggle = (signal: t.Signal<boolean>) => (signal.value = !signal.value);
