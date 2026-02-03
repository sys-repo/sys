import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Bullet, Button, Signal, D, Rx, Obj, Str, Is } from './common.ts';

export type OriginSelectorProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const OriginSelector: React.FC<OriginSelectorProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  const btn = () => {
    return <Button theme={theme.name}>{'foo'}</Button>;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {btn()}
      {btn()}
    </div>
  );
};
