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
  onVideoEnd?: t.VideoElementProps['onEnded'];
};

/**
 * Component:
 */
export const Column: React.FC<ColumnProps> = (props) => {
  const { align, video, debug = false, videoVisible = true } = props;
  const isCenter = align === 'Center';

  /**
   * Hooks:
   */
  const player = Player.Video.useSignals(video);
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

  const elPlayer = (
    <Player.Video.View
      {...player.props}
      debug={debug}
      onEnded={(e) => {
        props.onVideoEnd?.(e);
        player.props.onEnded?.(e);
      }}
    />
  );

  return (
    <Sheet
      theme={theme.name}
      orientation={'Bottom:Up'}
      shadowBlurRadius={isCenter ? undefined : 25}
      style={props.style}
    >
      <div ref={clickOutside.ref} className={styles.base.class}>
        <div className={styles.body.class}>{props.body}</div>
        <div className={styles.video.class}>{elPlayer}</div>
        <Player.Timestamp.Elapsed.View video={video} abs={true} show={debug} />
      </div>
    </Sheet>
  );
};
