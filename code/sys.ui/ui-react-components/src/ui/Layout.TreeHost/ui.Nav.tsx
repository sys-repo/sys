import React from 'react';
import { type t, Color, css } from './common.ts';
import { resolveParts } from './u.parts.ts';
import { NavHeader } from './ui.slot.NavHeader.tsx';
import { NavFooter } from './ui.slot.NavFooter.tsx';
import { Tree } from './ui.slot.Tree.tsx';
import { SlotHost } from './ui.SlotHost.tsx';

type P = t.TreeHost.Props;

/**
 * Component:
 */
export const Nav: React.FC<P> = (props) => {
  const { slots = {} } = props;
  const hasHeader = slots.nav?.header !== undefined;
  const hasFooter = slots.nav?.footer !== undefined;
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

  const elNavHeader = slots.nav?.header && (
    <SlotHost host={props} slot={'nav:header'}>
      <NavHeader {...props} />
    </SlotHost>
  );

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
      {elNavHeader}
      {elTree}
      {elNavFooter}
    </nav>
  );
};
