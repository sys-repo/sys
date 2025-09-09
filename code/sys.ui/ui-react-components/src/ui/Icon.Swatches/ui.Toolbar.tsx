import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, DEFAULTS, rx, Slider } from './common.ts';

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

  console.log('theme', theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      columnGap: 15,
    }),
    section: css({
      display: 'grid',
      placeItems: 'center',
    }),
  };

  const elSlider = (
    <Slider theme={theme.name} width={150} track={{ height: 5 }} thumb={{ size: 15 }} />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.section.class}>{`🐷`}</div>
      <div className={styles.section.class}>{}</div>
      <div className={styles.section.class}>{elSlider}</div>
    </div>
  );
};
