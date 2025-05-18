import React from 'react';
import { type t, Color, css, Style } from './common.ts';
import { Wrangle } from './u.ts';

type P = t.CropmarksProps;

export const Cropmarks: React.FC<P> = (props) => {
  const { size, subjectOnly = false } = props;

  if (subjectOnly) return props.children;

  const fillMargin = Wrangle.fillMargin(size);
  const sizeMode: t.CropmarksSizeMode = size?.mode ?? 'center';
  const is = {
    x: size?.mode === 'fill' && size.x && !size.y,
    y: size?.mode === 'fill' && !size.x && size.y,
  } as const;

  const Grid = {
    Fill: {
      columns: `[left] ${fillMargin[3]}px [body-x] 1fr [right] ${fillMargin[1]}px`,
      rows: `[top] ${fillMargin[0]}px [body-y] 1fr [bottom] ${fillMargin[2]}px`,
    },
    Center: {
      columns: `[left] 1fr [body-x] auto [right] 1fr`,
      rows: `[top] 1fr [body-y] auto [bottom] 1fr`,
    },
  } as const;

  /**
   * Render:
   */

  const fill = {
    gridTemplateColumns: is.y ? Grid.Center.columns : Grid.Fill.columns,
    gridTemplateRows: is.x ? Grid.Center.rows : Grid.Fill.rows,
  };
  const center = {
    gridTemplateColumns: Grid.Center.columns,
    gridTemplateRows: Grid.Center.rows,
  };
  const grid = {
    center: sizeMode === 'center' && center,
    fill: sizeMode === 'fill' && fill,
  };

  const [borderTop, borderRight, borderBottom, borderLeft] = wrangle.border(props);
  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
    block: css({}),
    subject: css({
      position: 'relative',
      borderTop,
      borderRight,
      borderBottom,
      borderLeft,
      width: size?.mode === 'center' ? size.width : undefined,
      height: size?.mode === 'center' ? size.height : undefined,
      display: 'grid',
    }),
  };

  const className = css(
    styles.base,
    sizeMode === 'center' ? grid.center : undefined,
    sizeMode === 'fill' ? grid.fill : undefined,
    props.style,
  ).class;

  return (
    <div className={className}>
      <div className={styles.block.class} />
      <div className={css(styles.block, { borderLeft, borderRight }).class} />
      <div className={styles.block.class} />
      <div className={css(styles.block, { borderTop, borderBottom }).class} />
      <div className={styles.subject.class}>{props.children}</div>
      <div className={css(styles.block, { borderTop, borderBottom }).class} />
      <div className={styles.block.class} />
      <div className={css(styles.block, { borderLeft, borderRight }).class} />
      <div className={styles.block.class} />
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  border(props: P) {
    const theme = Color.theme(props.theme);
    const [top, right, bottom, left] = wrangle.borderWidth(props);
    const { borderOpacity } = props;
    const opacity = typeof borderOpacity === 'number' ? borderOpacity : theme.is.dark ? 0.1 : 0.07;
    const color = Color.alpha(props.borderColor ?? theme.fg, opacity);

    if (opacity <= 0) return [];

    const border = (width: t.Pixels) => (width === 0 ? 'none' : `solid ${width}px ${color}`);
    return [border(top), border(right), border(bottom), border(left)] as const;
  },

  /**
   * Border width per edge (px).
   * – If that edge’s margin > 0 → 1 px (current behaviour)
   * – If the margin is 0        → 0 px (removes the “ghost” pixel)
   */
  borderWidth(props: P) {
    const { borderWidth = 1 } = props;
    const [t, r, b, l] = Wrangle.fillMargin(props.size);
    const width = (value: t.CssNumberOrStringInput) => (Style.isZero(value) ? 0 : borderWidth);

    const top = width(t);
    const right = width(r);
    const bottom = width(b);
    const left = width(l);

    return [top, right, bottom, left] as const;
  },
} as const;
