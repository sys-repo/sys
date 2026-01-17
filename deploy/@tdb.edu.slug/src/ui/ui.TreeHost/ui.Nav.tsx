import React from 'react';
import { type t, Color, css } from './common.ts';
import { Tree } from './ui.slot.Tree.tsx';
import { Aux } from './ui.slot.Aux.tsx';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const Nav: React.FC<P> = (props) => {
  const { debug = false, slots = {} } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: '1fr auto',
      minWidth: 0,
      minHeight: 0,
    }),
    top: css({ display: 'grid' }),
    bottom: css({ display: 'grid' }),
  };

  return (
    <nav className={css(styles.base, props.style).class}>
      <div className={styles.top.class}>{slots.tree ?? <Tree {...props} />}</div>
      <div className={styles.bottom.class}>{slots.aux ?? <Aux {...props} />}</div>
    </nav>
  );
};
