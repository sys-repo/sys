import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx, Sheet, Player, VIDEO } from './common.ts';

export type ColumnProps = {
  body?: t.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Column: React.FC<ColumnProps> = (props) => {
  const {} = props;

  const player = playerRef.current;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: `1fr auto`,
    }),
    body: css({}),
    top: css({}),
    player: css({}),
  };

  return (
    <Sheet theme={theme.name} orientation={'Bottom:Up'} style={props.style}>
      <div className={styles.base.class}>
        <div className={styles.top.class}>{props.body}</div>

        <Player.Video.View
          signals={player}
          style={styles.player}
        />
      </div>
    </Sheet>
  );
};
