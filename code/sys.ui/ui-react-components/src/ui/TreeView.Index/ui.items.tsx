import { JSX } from '../../common/t.ts';
import { type t, D, IndexTreeViewItem, Is } from './common.ts';
import { resolveShowChevron } from './u.chevron.ts';
const Item = IndexTreeViewItem;

export function renderItems(
  props: t.IndexTreeViewProps,
  view: t.TreeViewNodeView[],
): JSX.Element[] {
  const { debug = false } = props;

  return view.map(({ node, depth }) => {
    const isInline = !!node.self?.inline;
    const showChevron = isInline
      ? false
      : resolveShowChevron(node, props.showChevron ?? D.showChevron);
    const enabled = Boolean(node.meta?.enabled ?? true);
    return (
      <Item.UI
        key={node.key}
        debug={debug}
        theme={props.theme}
        label={node.label}
        chevron={showChevron}
        enabled={enabled}
        depth={depth}
        indentSize={props.indentSize ?? D.indentSize}
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
  });
}

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
