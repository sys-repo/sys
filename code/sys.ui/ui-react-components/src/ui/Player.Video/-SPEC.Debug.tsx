import React, { useState } from 'react';
import { type t, Color, css, Signal, Time } from './common.ts';

export type DebugProps = {
  ctx: { signals: t.VideoPlayerSignals };
  theme?: t.CommonTheme;
  style?: t.CssValue;
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
    Time.delay(redraw);
  });

  /**
   * Render.
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
      lineHeight: 1.6,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div onClick={() => s.jumpTo(12)}>jumpTo(12, play)</div>
      <div onClick={() => s.jumpTo(12, { play: false })}>jumpTo(12, paused)</div>
      <hr />
      <div onClick={() => toggle(p.playing)}>{`play (toggle): ${p.playing}`}</div>
      <div onClick={() => toggle(p.loop)}>{`loop (toggle): ${p.loop}`}</div>
    </div>
  );
};

/**
 * Helpers
 */
const toggle = (signal: t.Signal<boolean>) => (signal.value = !signal.value);
