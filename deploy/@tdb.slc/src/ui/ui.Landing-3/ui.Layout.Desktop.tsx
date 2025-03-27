import React from 'react';
import { type t, Color, Cropmarks, css } from './common.ts';

export type LayoutDesktopProps = {
  signals?: t.SlcSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const LayoutDesktop: React.FC<LayoutDesktopProps> = (props) => {
  const { signals } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={props.theme} borderOpacity={0.05}>
        <div>{`🐷 Layout: Desktop`}</div>
      </Cropmarks>
    </div>
  );
};
