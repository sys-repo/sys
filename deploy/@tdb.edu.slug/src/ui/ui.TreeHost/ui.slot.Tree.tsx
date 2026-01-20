import React from 'react';
import { type t, Color, css, TreeView } from './common.ts';
import { Empty } from './ui.Empty.tsx';

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
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    body: css({ Absolute: 0, Scroll: true }),
  };

  const elEmpty = !tree && (
    <Empty theme={theme.name} children={slots.empty?.('tree') ?? 'No tree to display'} />
  );

  const elTree = tree && (
    <TreeView.Index.UI
      theme={theme.name}
      root={tree}
      minWidth={0}
      path={props.selectedPath}
      onPressDown={(e) => {
        if (!tree) return;
        const path = e.node.path ?? [];

        if (e.hasChildren) {
          // intent: navigate
          props.onPathRequest?.({ tree, path });
          return;
        }

        // intent: terminal selection
        props.onLeafSelect?.({ tree, path, node: e.node });
      }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{elEmpty || elTree}</div>
    </div>
  );
};
