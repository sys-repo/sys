import React from 'react';
import { type t, css, Signal } from './common.ts';

export type ElapsedTimeProps = {
  player?: t.VideoPlayerSignals;
  abs?: t.CssEdgesInput | boolean;
  show?: boolean;
  style?: t.CssInput;
};

type P = ElapsedTimeProps;

/**
 * Component:
 */
export const ElapsedTime: React.FC<P> = (props) => {
  const { player, show = true } = props;
  const currentTime = player?.props.currentTime.value ?? 0;

  Signal.useRedrawEffect(() => player?.props.currentTime.value);
  if (!show) return null;

  /**
   * Render:
   */
  const styles = {
    base: css({
      Absolute: wrangle.abs(props),
      userSelect: 'none',
      fontSize: 11,
      opacity: 0.3,
    }),
  };

  return <div className={css(styles.base, props.style).class}>{formatTime(currentTime)}</div>;
};

/**
 * Helpers
 */
const formatTime = (timeInSeconds: number): string => {
  if (timeInSeconds < 0) timeInSeconds = 0;
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  const centi = Math.floor((timeInSeconds % 1) * 100);
  const fmt = (value: number) => String(value).padStart(2, '0');
  return `${fmt(mins)}:${fmt(secs)}:${fmt(centi)}`;
};

/**
 * Helpers
 */
const wrangle = {
  abs(props: P): t.CssEdgesInput {
    const { abs } = props;
    if (!abs) return;
    if (abs === true) return [5, 6, null, null];
    if (Array.isArray(abs)) return abs;
    return;
  },
} as const;
