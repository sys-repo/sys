import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is, Button } from './common.ts';

export type TabProps = {
  index: t.Index;
  item: t.Tabs.Item;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Tab: React.FC<TabProps> = (props) => {
  const { item } = props;

  /**
   * Handlers:
   */
  function handleClick() {
    console.log('click');
  }

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      height: D.Tabstrip.height,
      display: 'grid',
      minWidth: 0,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button theme={theme.name} onClick={handleClick}>
        {item.label || item.id}
      </Button>
    </div>
  );
};
