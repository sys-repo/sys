import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is, ObjectView } from './common.ts';

export type FooProps = {
  tab: t.Tabs.Item;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Foo: React.FC<FooProps> = (props) => {
  const { debug = false, tab } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      userSelect: 'none',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 6,
      display: 'grid',
    }),
    body: css({
      backgroundColor: Color.ruby(0.1),
      border: `dashed 1px ${Color.alpha(theme.fg, 0.1)}`,
      borderRadius: 8,
      padding: 20,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <ObjectView theme={theme.name} data={tab} name={'tab:item'} expand={1} />
      </div>
    </div>
  );
};
