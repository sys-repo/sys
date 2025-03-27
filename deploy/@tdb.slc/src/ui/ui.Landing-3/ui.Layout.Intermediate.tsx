import React from 'react';
import { type t, Color, Cropmarks, css } from './common.ts';

export type LayoutIntermediateProps = {
  signals?: t.SlcSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const LayoutIntermediate: React.FC<LayoutIntermediateProps> = (props) => {
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
        <div>{`🐷 Layout: Intermediate`}</div>
      </Cropmarks>
    </div>
  );
};
