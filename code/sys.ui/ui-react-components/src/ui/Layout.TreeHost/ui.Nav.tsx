import React from 'react';
import { type t, Color, css } from './common.ts';
import { resolveParts } from './u.parts.ts';
import { Aux } from './ui.slot.Aux.tsx';
import { Tree } from './ui.slot.Tree.tsx';
import { SlotHost } from './ui.SlotHost.tsx';

type P = t.TreeHostProps;

/**
 * Component:
 */
export const Nav: React.FC<P> = (props) => {
  const { slots = {} } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const parts = resolveParts(props);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'minmax(0, 1fr) auto',
      minWidth: 0,
      minHeight: 0,
      backgroundColor: parts.nav.backgroundColor,
    }),
  };

  const elTree = (
    <SlotHost host={props} slot={'tree'}>
      <Tree {...props} />
    </SlotHost>
  );

  const elAux = slots.aux && (
    <SlotHost host={props} slot={'aux'}>
      <Aux {...props} />
    </SlotHost>
  );

  return (
    <nav className={css(styles.base, props.style).class}>
      {elTree}
      {elAux}
    </nav>
  );
};
