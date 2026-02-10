import React from 'react';
import { type t, Color, css } from './common.ts';
import { toSlotNode } from './u.slot.ts';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const Aux: React.FC<P> = (props) => {
  const { debug = false, slots = {} } = props;
  const slotInput = slots.aux;
  if (slotInput === undefined) return null;
  const slotNode = toSlotNode(slotInput, { slot: 'aux' });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
  };

  return <div className={css(styles.base, props.style).class}>{slotNode}</div>;
};
