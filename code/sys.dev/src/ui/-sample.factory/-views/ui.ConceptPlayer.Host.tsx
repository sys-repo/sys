import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, rx } from '../common.ts';

export type ConceptPlayerHostProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const ConceptPlayerHost: React.FC<ConceptPlayerHostProps> = (props) => {
  const {} = props;

  console.log('props', props);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 ConceptPlayerHost`}</div>
    </div>
  );
};
