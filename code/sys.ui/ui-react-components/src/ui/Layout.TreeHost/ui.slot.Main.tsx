import React from 'react';
import { type t, Color, css } from './common.ts';
import { toSlotNode } from './u.slot.ts';
import { Empty } from './ui.Empty.tsx';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const Main: React.FC<P> = (props) => {
  const { debug = false, slots = {} } = props;
  const slotInput = slots.main;
  const hasSlotOverride = slotInput !== undefined;
  const slotNode = toSlotNode(slotInput, { slot: 'main' });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
    }),
  };

  const elEmpty = !hasSlotOverride
    ? <Empty theme={theme.name} children={slots?.empty?.({ slot: 'main' }) ?? 'No content to display'} />
    : undefined;
  const elContent = hasSlotOverride ? slotNode : elEmpty;

  return <main className={css(styles.base, props.style).class}>{elContent}</main>;
};
