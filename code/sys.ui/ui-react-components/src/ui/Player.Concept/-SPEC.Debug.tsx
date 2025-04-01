import React from 'react';
import { Button } from '../Button/mod.ts';
import { Color, css, Signal, type t } from './common.ts';

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

  Signal.useRedrawEffect(() => {
    p.ready.value;
    p.loop.value;
    p.playing.value;
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={css(styles.title).class}>{'WIP'}</div>

      <Button block={true} label={`action: jumpTo(12, play)`} onClick={() => s.jumpTo(12)} />
      <Button
        block={true}
        label={`action: jumpTo(12, paused)`}
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
