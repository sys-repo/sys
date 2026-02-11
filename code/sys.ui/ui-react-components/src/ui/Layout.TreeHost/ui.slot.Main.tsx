import React from 'react';
import { type t, Color, css } from './common.ts';
import { shouldRenderEmpty, toSlotNode } from './u.slot.ts';
import { Empty } from './ui.Empty.tsx';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const Main: React.FC<P> = (props) => {
  const { slots = {} } = props;
  const slotInput = slots.main;
  const slotNode = toSlotNode(slotInput, { slot: 'main' });
  const hasContent = slotNode !== undefined;

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

  const elEmpty = shouldRenderEmpty({ props, slot: 'main', hasContent })
    ? <Empty theme={theme.name} children={slots?.empty?.({ slot: 'main' }) ?? 'No content to display'} />
    : undefined;
  const elContent = slotNode ?? elEmpty;

  return (
    <main className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{elContent}</div>
    </main>
  );
};
