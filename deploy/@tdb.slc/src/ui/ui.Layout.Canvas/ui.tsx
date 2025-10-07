import React from 'react';
import { type t, Color, css, D, Is, useSizeObserver } from './common.ts';

export const CanvasLayout: React.FC<t.CanvasLayoutProps> = (props) => {
  const { debug = false, panels = {} } = props;

  /**
   * Hooks:
   */
  const size = useSizeObserver();
  const ready = size.ready;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const borderWidth = props.borderWidth ?? D.borderWidth;
  const border = `solid ${borderWidth}px ${Color.alpha(theme.fg, 1)}`;
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug ? 0 : 0),
      color: theme.fg,
      border,
      opacity: ready ? 1 : 0,
      display: 'grid',
    }),
    /**
     * Grid layout:
     */
    body: css({
      position: 'relative',
      display: 'grid',
      gridTemplateRows: `1fr 2.5fr 1fr`,
    }),
    row: css({
      borderBottom: border,
      ':last-child': { borderBottom: 'none' },
      display: 'grid',
    }),
    cell: css({
      borderRight: border,
      ':last-child': { borderRight: 'none' },
      display: 'grid',
    }),
    top: css({
      display: 'grid',
      gridTemplateColumns: `repeat(2, 1fr)`,
    }),
    middle: css({
      display: 'grid',
      gridTemplateColumns: `repeat(5, 1fr)`,
    }),
    bottom: css({
      display: 'grid',
      gridTemplateColumns: `repeat(2, 1fr)`,
    }),

    /**
     * Panel/Cell content:
     */
    content: css({ display: 'grid' }),

    /**
     * Debug:
     */
    debug: {
      size: css({
        Absolute: [5, 8, null, null],
        fontSize: 11,
        pointerEvents: 'none',
        opacity: 0.2,
        ...props.debugSize?.style,
      }),
    },
  };

  const render = (name: t.CanvasPanel) => {
    const { view } = wrangle.content(panels[name]);
    if (!view) return null;

    const style = css({ padding: Is.string(view) ? '1em' : 0 });
    return <div className={css(styles.content, style).class}>{view}</div>;
  };

  const elBody = (
    <div className={styles.body.class}>
      <div className={css(styles.row, styles.top).class}>
        <div className={styles.cell.class}>{render('purpose')}</div>
        <div className={styles.cell.class}>{render('impact')}</div>
      </div>
      <div className={css(styles.row, styles.middle).class}>
        <div className={styles.cell.class}>{render('problem')}</div>
        <div className={styles.cell.class}>
          <div className={css(styles.row).class}>{render('solution')}</div>
          <div className={styles.row.class}>{render('metrics')}</div>
        </div>
        <div className={styles.cell.class}>{render('uvp')}</div>
        <div className={styles.cell.class}>
          <div className={css(styles.row).class}>{render('advantage')}</div>
          <div className={styles.row.class}>{render('channels')}</div>
        </div>
        <div className={styles.cell.class}>{render('customers')}</div>
      </div>
      <div className={css(styles.row, styles.bottom).class}>
        <div className={styles.cell.class}>{render('costs')}</div>
        <div className={styles.cell.class}>{render('revenue')}</div>
      </div>
    </div>
  );

  const elDebugSize = debug && (
    <div className={styles.debug.size.class}>{`${size.width} x ${size.height}`}</div>
  );

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      {elBody}
      {elDebugSize}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  content(panel?: t.CanvasPanelContentOrNode): t.CanvasPanelContent {
    if (!panel) return {};

    // const isNode = Is.string(panel);
    if (Is.string(panel)) return { view: panel };

    // if (Is.func(panel.view)) return { view: panel.view() };

    return panel as t.CanvasPanelContent;
  },

  // view(panel?: t.CanvasPanelContentOrNode): t.ReactNode {
  //   const { view } = wrangle.content(panel);
  //   // const view = panel
  //   // return Is.func(view) ? view() : view;
  // },
} as const;
