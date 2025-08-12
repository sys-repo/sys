import React from 'react';
import { type t, Color, css, D, IndexTreeItem } from './common.ts';
import { toList } from './m.IndexTree.u.ts';

export const IndexTree: React.FC<t.IndexTreeProps> = (props) => {
  const { debug = false, minWidth = D.minWidth, root } = props;
  const list = toList(root);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
    body: css({ minWidth }),
  };

  const elItems = list.map((node) => {
    const enabled = Boolean(node.meta?.enabled ?? true);
    return (
      <IndexTreeItem
        key={node.key}
        debug={debug}
        theme={theme.name}
        label={node.label}
        chevron={hasChildren(node)}
        enabled={enabled}
        onPointer={(e) => props.onPointer?.({ ...e, node })}
        onPressDown={(e) => props.onPressDown?.({ ...e, node })}
        onPressUp={(e) => props.onPressUp?.({ ...e, node })}
      />
    );
  });

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{elItems}</div>
    </div>
  );
};

/**
 * Helpers:
 */
const hasChildren = (n: t.TreeNode) => !!(n.children && n.children.length > 0);
