import React from 'react';

import { type t, Color, css, D, IndexTreeItem, Obj } from './common.ts';
import { toList } from './m.IndexTree.u.ts';
import { SlideDeck } from './u.SlideDeck.tsx';
import { at, hasChildren } from './u.ts';

export const IndexTree: React.FC<t.IndexTreeProps> = (props) => {
  const { debug = false, minWidth = D.minWidth, root } = props;

  // Normalize root → list; then drill to `path`.
  const rootList = React.useMemo(() => toList(root), [root]);
  const path = (props.path ?? []) as t.ObjectPath;
  const view = React.useMemo(() => at(rootList, path), [rootList, path]);

  // Determine slide direction from path depth delta.
  const prevPathRef = React.useRef<t.ObjectPath>(path);
  const prev = prevPathRef.current;
  const depthDelta = path.length - prev.length;
  const dir: -1 | 0 | 1 = depthDelta > 0 ? 1 : depthDelta < 0 ? -1 : 0;
  React.useEffect(() => void (prevPathRef.current = path), [path]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
    body: css({ minWidth }),
  };

  const animKey = Obj.Path.codec.encode(path);

  return (
    <div className={css(styles.base, props.style).class}>
      <SlideDeck keyId={animKey} dir={dir} style={styles.body}>
        {view.map((node) => {
          const enabled = Boolean(node.meta?.enabled ?? true);
          return (
            <IndexTreeItem
              key={node.key}
              debug={debug}
              theme={theme.name}
              label={node.label}
              chevron={hasChildren(node)}
              enabled={enabled}
              onPointer={(e) => props.onPointer?.(toPointerEvent(node, e))}
              onPressDown={(e) => props.onPressDown?.(toPointerEvent(node, e))}
              onPressUp={(e) => props.onPressUp?.(toPointerEvent(node, e))}
            />
          );
        })}
      </SlideDeck>
    </div>
  );
};

/**
 * Helpers:
 */
function toPointerEvent(node: t.TreeNode, e: t.PointerEventsArg): t.IndexTreePointer {
  return { ...e, node, hasChildren: hasChildren(node) };
}
