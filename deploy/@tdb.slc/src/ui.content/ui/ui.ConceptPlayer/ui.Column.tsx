import React from 'react';
import { type t, Color, css, Player, Sheet, useClickOutside } from './common.ts';

export type ColumnProps = {
  debug?: boolean;
  align: t.ConceptPlayerAlign;
  body?: t.ReactNode;
  video?: t.VideoPlayerSignals;
  videoVisible?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClickOutside?: t.DomMouseEventHandler;
  onVideoEnd?: t.VideoPlayerEndedHandler;
};

/**
 * Component:
 */
export const Column: React.FC<ColumnProps> = (props) => {
  const { align, debug = false, videoVisible = true } = props;
  const isCenter = align === 'Center';
  const player = props.video;

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
    video: css({ display: videoVisible ? 'grid' : 'none' }),
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
          <Player.Video.Element video={player} debug={debug} onEnded={props.onVideoEnd} />
        </div>
        <Player.Timestamp.Elapsed.View player={player} abs={true} show={debug} />
      </div>
    </Sheet>
  );
};
