import React from 'react';
import { type t, Color, css, Tree as BaseTree } from './common.ts';
import { Empty } from './ui.Empty.tsx';

type P = t.LayoutTreeSplitProps;

/**
 * Component:
 */
export const Tree: React.FC<P> = (props) => {
  const { debug = false, root, slots = {} } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    body: css({ Absolute: 0, Scroll: true }),
  };

  const elEmpty = !root && (
    <Empty theme={theme.name} children={slots.empty?.('tree') ?? 'No tree to display'} />
  );

  const elTree = !elEmpty && (
    <BaseTree.Index.View
      theme={theme.name}
      root={root}
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
