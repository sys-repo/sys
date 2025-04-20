import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx, ConceptPlayer } from './common.ts';

export type ProgrammeRootProps = t.StaticContentProps & {};

/**
 * Component:
 */
export const ProgrammeRoot: React.FC<ProgrammeRootProps> = (props) => {
  const { state } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      pointerEvents: 'auto',
    }),
  };


  return (
    <div className={css(styles.base).class}>
    </div>
  );
};
