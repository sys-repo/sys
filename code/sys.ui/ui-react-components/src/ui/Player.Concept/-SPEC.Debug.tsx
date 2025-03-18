import React, { useState } from 'react';
import { Color, css, Signal, type t, Time } from './common.ts';
import { Button } from '../Button/mod.ts';

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

  Signal.useEffect(() => {
    p.ready.value;
    p.loop.value;
    p.playing.value;
    Time.delay(redraw);
  });

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button block={true} label={`method: jumpTo(12, play)`} onClick={() => s.jumpTo(12)} />
      <Button
        block={true}
        label={`method: jumpTo(12, paused)`}
        onClick={() => s.jumpTo(12, { play: false })}
      />
      <hr />
      <Button block={true} label={`play: ${p.playing}`} onClick={() => toggle(p.playing)} />
      <Button block={true} label={`loop: ${p.loop}`} onClick={() => toggle(p.loop)} />
    </div>
  );
};

/**
 * Helpers
 */
const toggle = (signal: t.Signal<boolean>) => (signal.value = !signal.value);
