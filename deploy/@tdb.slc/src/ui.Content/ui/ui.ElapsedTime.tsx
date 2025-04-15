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

  return <div className={css(styles.base, props.style).class}>{formatTime(currentTime)}</div>;
};

/**
 * Helpers
 */
const formatTime = (timeInSeconds: number): string => {
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  const centi = Math.floor((timeInSeconds % 1) * 100);
  const fmt = (value: number) => String(value).padStart(2, '0');
  return `${fmt(mins)}:${fmt(secs)}:${fmt(centi)}`;
};
