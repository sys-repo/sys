import React from 'react';
import { type t, Color, css } from './common.ts';
import { toSlotNode } from './u.slot.ts';

import { Empty } from './ui.Empty.tsx';
import { HostTreeView } from './ui.slot.Tree.TreeView.tsx';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const Tree: React.FC<P> = (props) => {
  const { tree, slots = {} } = props;
  const slotInput = slots.tree;
  const hasSlotOverride = slotInput !== undefined;
  const slotNode = toSlotNode(slotInput, { slot: 'tree' });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    body: css({ display: 'grid' }),
  };

  const elEmpty = !tree
    ? <Empty theme={theme.name} children={slots.empty?.({ slot: 'tree' }) ?? 'No tree to display'} />
    : undefined;

  const elTree = tree && !hasSlotOverride ? <HostTreeView {...props} /> : undefined;
  const elContent = hasSlotOverride ? slotNode : (elEmpty ?? elTree);

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{elContent}</div>
    </div>
  );
};
