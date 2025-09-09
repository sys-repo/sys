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
  const styles = {
    base: css({
      color: theme.fg,
      padding: 15,
      borderBottom: `dashed 1px ${Color.alpha(theme.fg, 0.3)}`,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      columnGap: 15,
    }),
    section: css({ display: 'grid', placeItems: 'center' }),
  };

  const elSlider = (
    <Slider
      theme={theme.name}
      width={200}
      track={{ height: 5 }}
      thumb={{ size: 15 }}
      percent={0.5}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.section.class}>{}</div>
      <div className={styles.section.class}>{elSlider}</div>
      <div className={styles.section.class}>{}</div>
    </div>
  );
};
