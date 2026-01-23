import React from 'react';

import { type t, Color, css, D, Data, IndexTreeViewItem, Is, Obj } from './common.ts';
import { SlideDeck } from './u.SlideDeck.tsx';
import { resolveShowChevron } from './u.chevron.ts';

export const IndexTreeView: React.FC<t.IndexTreeViewProps> = (props) => {
  const { debug = false, minWidth, root } = props;

  // Normalize root → list; then drill to `path`.
  const rootList = React.useMemo(() => Data.toList(root), [root]);
  const path = (props.path ?? []) as t.ObjectPath;
  const pathKey = Obj.Path.encode(path);
  const view = React.useMemo(() => Data.at(rootList, path), [rootList, pathKey]);

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
    body: css({ minWidth: minWidth ?? D.minWidth }),
  };

  const animKey = Obj.Path.encode(path);

  return (
    <div className={css(styles.base, props.style).class}>
      <SlideDeck
        keyId={animKey}
        direction={dir}
        style={styles.body}
        duration={props.slideDuration}
        offset={props.slideOffset}
      >
        {view.map((node) => {
          const showChevron = resolveShowChevron(node, props.showChevron ?? D.showChevron);
          const enabled = Boolean(node.meta?.enabled ?? true);
          return (
            <IndexTreeViewItem
              key={node.key}
              debug={debug}
              theme={theme.name}
              label={node.label}
              chevron={showChevron}
              enabled={enabled}
              onPointer={(e) => props.onPointer?.(toPointerEvent(node, e, showChevron))}
              onPressDown={(e) => {
                const pointerEvent = toPointerEvent(node, e, showChevron);
                props.onNodeSelect?.({
                  is: { leaf: !pointerEvent.hasChildren },
                  path: node.path ?? [],
                  node,
                });
                props.onPressDown?.(pointerEvent);
              }}
              onPressUp={(e) => props.onPressUp?.(toPointerEvent(node, e, showChevron))}
              description={Is.str(node.meta?.description) ? node.meta.description : undefined}
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
function toPointerEvent(
  node: t.TreeViewNode,
  e: t.PointerEventsArg,
  hasChildren: boolean,
): t.IndexTreeViewPointer {
  return { ...e, node, hasChildren };
}
