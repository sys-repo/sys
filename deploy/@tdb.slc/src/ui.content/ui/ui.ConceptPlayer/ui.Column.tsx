import React, { useState } from 'react';
import { type t, Color, css, ElapsedTime, Player, Sheet, useClickOutside } from './common.ts';

export type ColumnProps = {
  debug?: boolean;
  align: t.ConceptPlayerAlign;
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
  const { align, debug = false } = props;
  const isCenter = align === 'Center';
  const player = props.video;
  const src = player?.props.src?.value ?? '';

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
    video: css({ display: 'grid' }),
  };

  return (
    <Sheet
      theme={theme.name}
      orientation={'Bottom:Up'}
      shadowBlurRadius={isCenter ? undefined : 25}
      style={props.style}
    >
      <div ref={clickOutside.ref} className={styles.base.class}>
        <div className={styles.body.class}>{props.body}</div>
        <div className={styles.video.class}>
          <Player.Video.View
            key={`${playerKey}.${src}`}
            signals={player}
            onEnded={() => {
              setPlayerKey((n) => n + 1); // Hack: force player to reset to start.
              console.info(`⚡️ Video:onEnd:`, src);
            }}
          />
        </div>
        <ElapsedTime player={player} abs={true} show={debug} />
      </div>
    </Sheet>
  );
};
