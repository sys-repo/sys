import React from 'react';
import { type t, css, Signal } from './common.ts';

export type ElapsedTimeProps = {
  player?: t.VideoPlayerSignals;
  abs?: t.CssEdgesInput;
  show?: boolean;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const ElapsedTime: React.FC<ElapsedTimeProps> = (props) => {
  const { player, show = true } = props;
  const currentTime = player?.props.currentTime.value ?? 0;

  Signal.useRedrawEffect(() => player?.props.currentTime.value);
  if (!show) return null;
  if (currentTime <= 0) return null;

  /**
   * Render:
   */
  const styles = {
    base: css({
      Absolute: props.abs,
      userSelect: 'none',
      fontSize: 11,
      opacity: 0.5,
    }),
  };

  return <div className={css(styles.base, props.style).class}>{`${currentTime.toFixed(2)}s`}</div>;
};
