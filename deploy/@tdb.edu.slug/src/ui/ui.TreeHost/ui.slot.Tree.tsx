import React from 'react';
import { type t, Tree as BaseTree, Color, css } from './common.ts';
import { Empty } from './ui.Empty.tsx';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const Tree: React.FC<P> = (props) => {
  const { debug = false, tree, slots = {} } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    body: css({ Absolute: 0, Scroll: true }),
  };

  const elEmpty = !tree && (
    <Empty theme={theme.name} children={slots.empty?.('tree') ?? 'No tree to display'} />
  );

  const elTree = !elEmpty && (
    <BaseTree.Index.View
      theme={theme.name}
      root={tree}
      minWidth={0}
      path={props.selectedPath}
      onPressDown={(e) => {
        if (!e.hasChildren) return;
        props.onPathChange?.({ path: e.node.path });
      }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{elEmpty || elTree}</div>
    </div>
  );
};
