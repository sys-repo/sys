import React from 'react';
import { type t, Color, css } from './common.ts';
import { resolveParts } from './u.parts.ts';
import { shouldRenderEmpty, toSlotNode } from './u.slot.ts';
import { Empty } from './ui.Empty.tsx';

type P = t.TreeHost.Props;

/**
 * Component:
 */
export const Main: React.FC<P> = (props) => {
  const { slots = {} } = props;
  const slotInput = slots.main?.body;
  const slotNode = toSlotNode(slotInput, { slot: 'main:body' });
  const hasContent = slotNode != null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const parts = resolveParts(props);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      minHeight: 0,
      gridTemplateRows: 'minmax(0, 1fr)',
      backgroundColor: parts.main.backgroundColor,
    }),
    body: css({
      display: 'grid',
      minHeight: 0,
      gridTemplateRows: 'minmax(0, 1fr)',
    }),
  };

  const elEmpty = shouldRenderEmpty({ props, slot: 'main:body', hasContent })
    ? <Empty theme={theme.name} children={slots?.empty?.({ slot: 'main:body' }) ?? 'No content to display'} />
    : undefined;
  const elContent = slotNode ?? elEmpty;

  return (
    <main className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{elContent}</div>
    </main>
  );
};
