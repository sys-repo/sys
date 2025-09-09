import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, DEFAULTS, rx } from './common.ts';

export type ToolbarProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Toolbar: React.FC<ToolbarProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      columnGap: 15,
    }),
    section: css({
      backgroundColor: 'rgba(255, 0, 0, 0.3)' /* RED */,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.section.class}>{`🐷`}</div>
      <div className={styles.section.class}>{`🐷`}</div>
      <div className={styles.section.class}>{`🐷`}</div>
    </div>
  );
};
