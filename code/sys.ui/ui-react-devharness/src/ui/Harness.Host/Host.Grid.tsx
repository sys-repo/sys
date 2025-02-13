import { css, type t } from '../common.ts';
import { Wrangle } from './u.ts';

export type HostGridProps = {
  children?: t.ReactChildren;
  border?: string;
  renderProps?: t.DevRenderProps;
  style?: t.CssValue;
};

export const HostGrid: React.FC<HostGridProps> = (props) => {
  const { renderProps } = props;
  if (!renderProps?.subject.renderer) return null;

  const { size } = renderProps.subject;
  const fillMargin = Wrangle.fillMargin(size);
  const sizeMode = size?.mode ?? 'center';
  const is = {
    x: size?.mode === 'fill' && size.x && !size.y,
    y: size?.mode === 'fill' && !size.x && size.y,
  } as const;

  /**
   * [Render]
   */
  const GRID = {
    FILL: {
      COLUMNS: `[left] ${fillMargin[3]}px [body-x] 1fr [right] ${fillMargin[1]}px`,
      ROWS: `[top] ${fillMargin[0]}px [body-y] 1fr [bottom] ${fillMargin[2]}px`,
    },
    CENTER: {
      COLUMNS: `[left] 1fr [body-x] auto [right] 1fr`,
      ROWS: `[top] 1fr [body-y] auto [bottom] 1fr`,
    },
  } as const;

  const fill = {
    gridTemplateColumns: is.y ? GRID.CENTER.COLUMNS : GRID.FILL.COLUMNS,
    gridTemplateRows: is.x ? GRID.CENTER.ROWS : GRID.FILL.ROWS,
  };
  const center = {
    gridTemplateColumns: GRID.CENTER.COLUMNS,
    gridTemplateRows: GRID.CENTER.ROWS,
  };
  const grid = {
    center: sizeMode === 'center' && center,
    fill: sizeMode === 'fill' && fill,
  };

  const border = props.border;
  const borderLeft = border;
  const borderRight = border;
  const borderTop = border;
  const borderBottom = border;

  const styles = {
    base: css({ Absolute: 0, display: 'grid' }),
    block: css({}),
  };

  return (
    <div
      className={
        css(
          styles.base,
          sizeMode === 'center' ? grid.center : undefined,
          sizeMode === 'fill' ? grid.fill : undefined,
          props.style,
        ).class
      }
    >
      <div className={styles.block.class} />
      <div className={css(styles.block, { borderLeft, borderRight }).class} />
      <div className={styles.block.class} />
      <div className={css(styles.block, { borderTop, borderBottom }).class} />
      {props.children}
      <div className={css(styles.block, { borderTop, borderBottom }).class} />
      <div className={styles.block.class} />
      <div className={css(styles.block, { borderLeft, borderRight }).class} />
      <div className={styles.block.class} />
    </div>
  );
};
