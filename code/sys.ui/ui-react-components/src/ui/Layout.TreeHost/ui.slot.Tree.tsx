import React from 'react';
import { type t, Color, css } from './common.ts';

import { Empty } from './ui.Empty.tsx';
import { HostTreeView } from './ui.slot.Tree.TreeView.tsx';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const Tree: React.FC<P> = (props) => {
  const { tree, slots = {} } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
    }),
    body: css({ display: 'grid' }),
  };

  const elEmpty = !tree && (
    <Empty theme={theme.name} children={slots.empty?.('tree') ?? 'No tree to display'} />
  );

  const elTree = tree && !slots.tree && <HostTreeView {...props} />;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{elEmpty || slots.tree || elTree}</div>
    </div>
  );
};
