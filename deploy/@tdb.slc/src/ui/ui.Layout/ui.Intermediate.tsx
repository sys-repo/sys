import React from 'react';
import { type t, Color, Cropmarks, css } from './common.ts';

type P = t.LayoutIntermediateProps;

/**
 * Component:
 */
export const LayoutIntermediate: React.FC<P> = (props) => {
  const { signals } = props;
  const p = signals?.props;
  if (!p) return null;

  /**
   * Render:
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.05}>
        <div>{`🐷 Layout:Intermediate | stage: ${p.stage.value}`}</div>
      </Cropmarks>
    </div>
  );
};
