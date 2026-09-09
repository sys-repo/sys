import React from 'react';
import { type t, Color, css } from './common.ts';

export type PaneProps = {
  index: t.Index;
  hidden?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  children?: React.ReactNode;
};

export const Pane: React.FC<PaneProps> = (props) => {
  const { index, hidden = false, debug = false } = props;

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      minWidth: 0,
      minHeight: 0,
      overflow: 'auto',
      display: 'grid',
      visibility: hidden ? 'hidden' : 'visible',
      pointerEvents: hidden ? 'none' : 'auto',
    }),
  };

  return (
    <div
      className={css(styles.base, props.style).class}
      data-part={'pane'}
      data-index={index}
      data-hidden={hidden || undefined}
      children={props.children}
    />
  );
};
