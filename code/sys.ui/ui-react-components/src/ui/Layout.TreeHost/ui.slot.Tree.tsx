import React from 'react';
import { type t, Color, css } from './common.ts';
import { shouldRenderEmpty, toSlotNode } from './u.slot.ts';

import { Empty } from './ui.Empty.tsx';
import { HostTreeView } from './ui.slot.Tree.TreeView.tsx';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const Tree: React.FC<P> = (props) => {
  const { tree, slots = {} } = props;
  const slotInput = slots.tree;
  const slotNode = toSlotNode(slotInput, { slot: 'tree' });
  const elTree = tree ? <HostTreeView {...props} /> : undefined;
  const elDefault = slotNode ?? elTree;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      minHeight: 0,
      gridTemplateRows: 'minmax(0, 1fr)',
    }),
    body: css({
      display: 'grid',
      minHeight: 0,
      gridTemplateRows: 'minmax(0, 1fr)',
    }),
  };

  const elEmpty = shouldRenderEmpty({
    props,
    slot: 'tree',
    hasContent: elDefault !== undefined,
  })
    ? <Empty theme={theme.name} children={slots.empty?.({ slot: 'tree' }) ?? 'No tree to display'} />
    : undefined;
  const elContent = elDefault ?? elEmpty;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{elContent}</div>
    </div>
  );
};
