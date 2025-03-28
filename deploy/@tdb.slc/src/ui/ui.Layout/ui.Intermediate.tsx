import React from 'react';
import { type t, App, Cropmarks, css } from './common.ts';

type P = t.LayoutIntermediateProps;

/**
 * Component:
 */
export const LayoutIntermediate: React.FC<P> = (props) => {
  const { state } = props;
  const p = state?.props;
  if (!p) return null;

  /**
   * Render:
   */
  const theme = App.theme(state);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.05}>
        <div>{`🐷 Layout:Intermediate | stage: ${p.content.value?.id}`}</div>
      </Cropmarks>
    </div>
  );
};
