import React from 'react';
import { type t, Color, css } from './common.ts';
import { toSlotNode } from './u.slot.ts';

type P = t.TreeHost.Props;

/**
 * Component:
 */
export const NavFooter: React.FC<P> = (props) => {
  const { slots = {} } = props;
  const slotInput = slots.nav?.footer;
  if (slotInput === undefined) return null;
  const slotNode = toSlotNode(slotInput, { slot: 'nav:footer' });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
  };

  return <div className={css(styles.base, props.style).class}>{slotNode}</div>;
};
