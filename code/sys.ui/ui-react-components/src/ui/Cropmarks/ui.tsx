import React from 'react';
import { type t, Color, css } from './common.ts';
import { Wrangle } from './u.ts';

export const Cropmarks: React.FC<t.CropmarksProps> = (props) => {
  const { size } = props;

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
  const theme = Color.theme(props.theme);

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

  const border = props.border ?? `solid 1px ${Color.alpha(theme.fg, 0.1)}`;
  const borderLeft = border;
  const borderRight = border;
  const borderTop = border;
  const borderBottom = border;

  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
    block: css({}),
    subject: css({
      position: 'relative',
      border,
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
