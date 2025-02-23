import { useEffect, useRef, useState } from 'react';
import { type t, Color, css, FC, rx } from './common.ts';

export type ConceptPlayerProps = {
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const ConceptPlayer: React.FC<ConceptPlayerProps> = (props) => {
  const {} = props;

  /**
   * Render
   */
  const t = (ms: t.Msecs, ...attr: string[]) => attr.map((prop) => `${prop} ${ms}ms ease-in-out`);
  const transition = t(50, 'opacity');
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
    }),
  };

  return (
    <div style={css(styles.base, props.style)}>
      <div>{`🐷 ConceptPlayer`}</div>
    </div>
  );
};
