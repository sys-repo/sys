import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, DEFAULTS, rx } from './common.ts';

export type DropTargetProps = {
  doc?: t.Crdt.Ref;
  isDragdropping?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const DropTarget: React.FC<DropTargetProps> = (props) => {
  const { doc, isDragdropping = false } = props;

  let msg = isDragdropping ? 'Drop now' : 'Drop files here';
  if (!doc) msg = '( Drop target not ready )';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
    }),
    label: css({
      userSelect: 'none',
      opacity: doc ? 1 : 0.2,
      transition: `opacity 120ms ease`,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.label.class}>{msg}</div>
    </div>
  );
};
