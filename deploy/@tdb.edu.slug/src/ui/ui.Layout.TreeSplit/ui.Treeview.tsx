import React from 'react';
import { type t, Color, css, Tree } from './common.ts';
import { Empty } from './ui.Empty.tsx';

type P = t.LayoutTreeSplitProps;

/**
 * Component:
 */
export const Treeview: React.FC<P> = (props) => {
  const { debug = false, root } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
    empty: css({
      minHeight: 120,
      display: 'grid',
      placeItems: 'center',
      color: theme.fg,
      opacity: 0.65,
      fontSize: 13,
    }),
  };

  const elEmpty = !root && <Empty theme={theme.name} children={'No tree to display'} />;
  const elTree = !elEmpty && (
    <Tree.Index.View
      theme={theme.name}
      root={root}
      minWidth={0}
      path={props.path}
      onPressDown={(e) => {
        if (!e.hasChildren) return;
        props.onPathChange?.({ path: e.node.path });
      }}
    />
  );

  return <div className={css(styles.base, props.style).class}>{elEmpty || elTree}</div>;
};
