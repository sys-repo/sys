import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is, Button, KeyValue } from './common.ts';

export type DriverInfoProps = {
  title?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const DriverInfo: React.FC<DriverInfoProps> = (props) => {
  const { debug = false, title = D.name } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
    }),
  };

  const mono = true;
  const items: t.KeyValueItem[] = [{ kind: 'title', v: title }];

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI layout={{ kind: 'table' }} items={items} theme={theme.name} />
    </div>
  );
};
