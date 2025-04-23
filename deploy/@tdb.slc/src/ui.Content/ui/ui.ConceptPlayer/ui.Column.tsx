import React, { useState } from 'react';
import { type t, Color, css, Player, Sheet, useClickOutside } from './common.ts';

export type ColumnProps = {
  body?: t.ReactNode;
  video?: t.VideoPlayerSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClickOutside?: t.DomMouseEventHandler;
};

/**
 * Component:
 */
export const Column: React.FC<ColumnProps> = (props) => {
  const {} = props;
  const [playerKey, setPlayerKey] = useState(0);

  const clickOutside = useClickOutside({
    stage: 'down',
    callback: (e) => props.onClickOutside?.(e),
  });

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
    body: css({ display: 'grid' }),
    video: css({}),
  };

  return (
    <Sheet theme={theme.name} orientation={'Bottom:Up'} style={props.style}>
      <div ref={clickOutside.ref} className={styles.base.class}>
        <div className={styles.body.class}>{props.body}</div>
        <div className={styles.video.class}>
          <Player.Video.View
            key={playerKey}
            signals={props.video}
            onEnded={() => {
              // Hack: force player to reset to start.
              setPlayerKey((n) => n + 1);
            }}
          />
        </div>
      </div>
    </Sheet>
  );
};
