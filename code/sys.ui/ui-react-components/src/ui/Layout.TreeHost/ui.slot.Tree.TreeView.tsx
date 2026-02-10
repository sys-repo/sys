import React from 'react';
import { type t, Color, css, Obj, TreeData, TreeView } from './common.ts';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const HostTreeView: React.FC<P> = (props) => {
  const { tree, slots = {} } = props;
  if (!tree) return null;

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      minHeight: 0,
    }),
    body: css({
      Absolute: 0,
      Scroll: true,
    }),
  };

  const elTreeView = (
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
          // Intent: "navigate".
          const path = e.node.path ?? [];
          props.onPathRequest?.({ tree, path });
        }
      }}
    />
  );

  return (
    <div className={styles.base.class}>
      <div className={styles.body.class}>{elTreeView}</div>
    </div>
  );
};

/**
 * Helpers:
 */
function findViewNode(tree: t.TreeHostViewNodeList, path: t.ObjectPath) {
  return TreeData.find(tree, ({ node }) => Obj.Path.eql(node.path, path));
}
