import React from 'react';
import { type t, Color, Num, css, usePointer } from './common.ts';

type CharLength = number;

export type IdProps = {
  prefix?: string;
  value?: string;
  suffixLength?: CharLength;
  suffixColor?: string; // suffix color when pointer is over
  prefixColor?: string;
  gap?: number;
  lineHeight?: number;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Compact ID label: shows the id with a highlighted suffix on pointer-over.
 */
export const Id: React.FC<IdProps> = (props) => {
  const { debug = false, value = '', prefix, gap, suffixLength = 5, lineHeight = 1.2 } = props;

  // Split (clamped):
  const full = String(value ?? '');
  const split = Num.clamp(suffixLength || 0, 0, full.length);
  const hasSuffix = split > 0;
  const body = hasSuffix ? full.slice(0, full.length - split) : full;
  const suffix = hasSuffix ? full.slice(full.length - split) : '';

  /**
   * Hooks:
   */
  const pointer = usePointer();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const isOver = pointer.is.over || pointer.is.focused;
  const prefixColorProp = props.prefixColor ?? theme.fg;
  const suffixColorProp = props.suffixColor ?? theme.fg;

  // Colors/opacity derived from pointer state:
  const baseColor = theme.fg;
  const prefixColor = isOver ? prefixColorProp : baseColor;
  const suffixColor = isOver ? suffixColorProp : baseColor;
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
    left: css({ color: prefixColor }),
    middle: css({
      color: baseColor,
      opacity: !isOver ? 1 : hasSuffix ? 0.3 : 1,
    }),
    right: css({ color: suffixColor }),
  };

  const title = prefix ? `${prefix}${full ? ' ' + full : ''}` : full;

  return (
    <div
      className={css(styles.base, props.style).class}
      aria-label={title}
      role={'text'}
      {...pointer.handlers}
    >
      {prefix && <span className={styles.left.class}>{prefix}</span>}
      <span className={styles.middle.class}>{body}</span>
      {hasSuffix && <span className={styles.right.class}>{suffix}</span>}
    </div>
  );
};
