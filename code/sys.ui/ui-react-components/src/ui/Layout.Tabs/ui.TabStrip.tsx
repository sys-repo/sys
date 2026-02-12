import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is } from './common.ts';
import { Tab } from './ui.Tab.tsx';

type P = t.Tabs.Props;

/**
 * Component:
 */
export const TabStrip: React.FC<P> = (props) => {
  const { debug = false, items = [] } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      height: D.Tabstrip.height,
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      display: 'grid',
    }),
  };

  const elTabs = items.map((item, i) => {
    return <Tab key={item.id} theme={theme.name} item={item} index={i} />;
  });

  return <div className={css(styles.base, props.style).class}>{elTabs}</div>;
};
