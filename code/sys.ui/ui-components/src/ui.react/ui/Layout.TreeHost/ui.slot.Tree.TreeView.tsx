import React from 'react';
import { type t, Color, css, Obj, TreeData, TreeView } from './common.ts';

type P = t.TreeHost.Props;

/**
 * Component:
 */
export const HostTreeView: React.FC<P> = (props) => {
  const { tree, slots = {} } = props;
  if (!tree) return null;

  const path = props.selectedPath ?? [];
  const selectedNode = findViewNode(tree, path);
  const hasLeaf = !!selectedNode && !selectedNode.children?.length;

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      minHeight: 0,
      display: 'grid',
      gridTemplateRows: 'minmax(0, 1fr)',
    }),
    body: css({
      Absolute: 0,
      Scroll: true,
    }),
  };

  const elTreeView = (
    <TreeView.Index.UI
      style={{ Absolute: hasLeaf ? 0 : undefined }}
      theme={theme.name}
      root={tree}
      minWidth={0}
      path={props.selectedPath}
      showChevron={'always'}
      renderLeaf={(e) => {
        const path = e.path ?? [];
        const node = findViewNode(tree, path);
        if (!node) return null;
        return slots.nav?.leaf?.({ tree, path, node });
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
