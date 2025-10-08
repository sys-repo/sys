import React from 'react';
import { type t, Color, Num, css, usePointer } from './common.ts';

type CharLength = number;

export type IdLabelProps = {
  prefix?: string;
  value?: string;
  highlightLength?: CharLength;
  highlightColor?: string; // suffix color when pointer is over
  gap?: number;
  lineHeight?: number;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Compact ID label: shows the id with a highlighted suffix on pointer-over.
 */
export const IdLabel: React.FC<IdLabelProps> = (props) => {
  const {
    debug = false,
    value = '',
    prefix,
    gap,
    highlightLength = 5,
    highlightColor = Color.BLUE,
    lineHeight = 1.2,
  } = props;

  // Split (clamped):
  const full = String(value ?? '');
  const split = Num.clamp(highlightLength || 0, 0, full.length);
  const hasSuffix = split > 0;
  const left = hasSuffix ? full.slice(0, full.length - split) : full;
  const right = hasSuffix ? full.slice(full.length - split) : '';

  /**
   * Hooks:
   */
  const pointer = usePointer();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const isOver = pointer.is.over || pointer.is.focused;

  // Colors/opacity derived from pointer state:
  const baseColor = theme.fg;
  const suffixColor = isOver ? highlightColor : baseColor;
  const containerOpacity = isOver ? 1 : 0.2;

  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: baseColor,
      opacity: containerOpacity,
      lineHeight,
      outline: 'none',
      display: 'inline-flex',
      alignItems: 'baseline',
      gap,
      whiteSpace: 'nowrap',
    }),
    prefix: css({ color: baseColor }),
    left: css({ color: baseColor, opacity: hasSuffix ? 0.85 : 1 }),
    suffix: css({ color: suffixColor }),
  };

  const title = prefix ? `${prefix}${full ? ' ' + full : ''}` : full;

  return (
    <div
      className={css(styles.base, props.style).class}
      aria-label={title}
      role={'text'}
      {...pointer.handlers}
    >
      {prefix && <span className={styles.prefix.class}>{prefix}</span>}
      <span className={styles.left.class}>{left}</span>
      {hasSuffix && <span className={styles.suffix.class}>{right}</span>}
    </div>
  );
};
