import React from 'react';
import { type t, Color, Cropmarks, css } from './common.ts';

export type LayoutDesktopProps = {
  signals?: t.SlcSignals;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const LayoutDesktop: React.FC<LayoutDesktopProps> = (props) => {
  const { signals } = props;
  if (!signals) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.signals?.theme.value);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.05}>
        <div>{`🐷 Layout:Desktop | stage: ${signals.stage.value}`}</div>
      </Cropmarks>
    </div>
  );
};
