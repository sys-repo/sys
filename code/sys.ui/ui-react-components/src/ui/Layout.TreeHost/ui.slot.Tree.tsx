import React from 'react';
import { type t, Color, css, Obj, TreeView, TreeData } from './common.ts';

import { Empty } from './ui.Empty.tsx';
import { Spinning, contentStyle, spinnerForSlot } from './ui.Spinning.tsx';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const Tree: React.FC<P> = (props) => {
  const { tree, slots = {} } = props;
  const spinning = spinnerForSlot(props.spinner, 'tree');

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    body: css({ Absolute: 0, Scroll: true }),
    content: css({ display: 'grid', minHeight: '100%', ...contentStyle(spinning) }),
    spinning: css({ Absolute: 0 }),
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
      showChevron={'always'}
      renderLeaf={(e) => {
        const path = e.path ?? [];
        const node = findViewNode(tree, path);
        if (!node) return null;
        return slots.treeLeaf?.({ tree, path, node });
      }}
      onNodeSelect={(e) => {
        if (!tree) return;
        const path = e.path ?? [];
        const node = findViewNode(tree, path);
        if (node) props.onNodeSelect?.({ tree, path, node, is: e.is });
      }}
      onPressDown={(e) => {
        if (!tree) return;
        if (e.hasChildren) {
          // Intent: navigate.
          const path = e.node.path ?? [];
          props.onPathRequest?.({ tree, path });
        }
      }}
    />
  );
  const elSpinner = spinning && (
    <Spinning
      theme={theme.name}
      position={spinning.position}
      style={styles.spinning}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div className={styles.content.class}>{elEmpty || elTree}</div>
      </div>
      {elSpinner}
    </div>
  );
};

function findViewNode(tree: t.TreeHostViewNodeList, path: t.ObjectPath) {
  return TreeData.find(tree, ({ node }) => Obj.Path.eql(node.path, path));
}
