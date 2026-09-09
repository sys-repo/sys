import React from 'react';
import { type t, Color, css } from './common.ts';
import { resolveParts } from './u.parts.ts';
import { toSlotNode } from './u.slot.ts';
import { NavFooter } from './ui.slot.NavFooter.tsx';
import { NavHeader } from './ui.slot.NavHeader.tsx';
import { Tree } from './ui.slot.Tree.tsx';
import { SlotHost } from './ui.SlotHost.tsx';

type P = t.TreeHost.Props;

/**
 * Component:
 */
export const Nav: React.FC<P> = (props) => {
  const { slots = {} } = props;
  // Resolve once so row presence derives from rendered output and renderers are not double-invoked.
  const headerNode = toSlotNode(slots.nav?.header, { slot: 'nav:header' });
  const footerNode = toSlotNode(slots.nav?.footer, { slot: 'nav:footer' });
  const hasHeader = headerNode != null;
  const hasFooter = footerNode != null;
  const rows = [
    hasHeader ? 'auto' : undefined,
    'minmax(0, 1fr)',
    hasFooter ? 'auto' : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const parts = resolveParts(props);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: rows,
      minWidth: 0,
      minHeight: 0,
      backgroundColor: parts.nav.backgroundColor,
    }),
  };

  const elNavHeader = hasHeader && (
    <SlotHost host={props} slot={'nav:header'}>
      <NavHeader theme={props.theme}>{headerNode}</NavHeader>
    </SlotHost>
  );

  const elTree = (
    <SlotHost host={props} slot={'nav:tree'}>
      <Tree {...props} />
    </SlotHost>
  );

  const elNavFooter = hasFooter && (
    <SlotHost host={props} slot={'nav:footer'}>
      <NavFooter theme={props.theme}>{footerNode}</NavFooter>
    </SlotHost>
  );

  return (
    <nav className={css(styles.base, props.style).class}>
      {elNavHeader}
      {elTree}
      {elNavFooter}
    </nav>
  );
};
