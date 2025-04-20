import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx } from './common.ts';
import { Cropmarks } from './ui.Cropmarks.tsx';

type P = t.ConceptPlayerProps & { size: t.DomRect };

/**
 * Component:
 */
export const Body: React.FC<P> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} debug={debug}>
      </Cropmarks>
    </div>
  );
};
