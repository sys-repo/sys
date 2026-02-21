import React from 'react';
import { type t, Color, css } from './common.ts';
import { resolveParts } from './u.parts.ts';
import { NavFooter } from './ui.slot.NavFooter.tsx';
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
    <SlotHost host={props} slot={'nav:tree'}>
      <Tree {...props} />
    </SlotHost>
  );

  const elNavFooter = slots.nav?.footer && (
    <SlotHost host={props} slot={'nav:footer'}>
      <NavFooter {...props} />
    </SlotHost>
  );

  return (
    <nav className={css(styles.base, props.style).class}>
      {elTree}
      {elNavFooter}
    </nav>
  );
};
