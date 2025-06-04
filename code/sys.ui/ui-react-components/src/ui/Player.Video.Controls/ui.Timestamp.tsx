import React from 'react';
import { type t, css } from './common.ts';

export type TimestampProps = {
  currentTime?: t.Secs;
  duration?: t.Secs;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Timestamp: React.FC<TimestampProps> = (props) => {
  const { currentTime, duration } = props;

  /**
   * Render:
   */
  const styles = {
    base: css({
      fontSize: 14,
      userSelect: 'none',
      display: 'grid',
      alignItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {formatTimePair(currentTime, duration)}
    </div>
  );
};

/**
 * Formats currentTime/duration both in Secs (number → string).
 * - If both are undefined: returns "-/-"
 * - If one is undefined: uses "-" for that side
 * - Otherwise: "formattedCurrent / formattedDuration"
 */
export const formatTimePair = (currentTime?: t.Secs, duration?: t.Secs): string => {
  if (currentTime == null && duration == null) return '-/-';
  const currStr = currentTime != null ? formatSecs(currentTime) : '-';
  const durStr = duration != null ? formatSecs(duration) : '-';
  return `${currStr} / ${durStr}`;
};

/**
 * Convert a number of seconds into a dot‐separated string:
 *  - < 1 h: "M.SS"       (e.g. 62   → "1.02")
 *  - ≥ 1 h: "H.MM.SS"    (e.g. 4815 → "1.20.15")
 */
const formatSecs = (rawSecs: t.Secs): string => {
  const total = Math.floor(rawSecs < 0 ? 0 : rawSecs);
  const hours = Math.floor(total / 3600);
  const rem = total % 3600;
  const mins = Math.floor(rem / 60);
  const secs = rem % 60;

  const two = (n: number) => n.toString().padStart(2, '0');

  if (hours === 0) {
    // Format as "M:SS"
    return `${mins}:${two(secs)}`;
  } else {
    // Format as "H:MM:SS"
    return `${hours}:${two(mins)}:${two(secs)}`;
  }
};
