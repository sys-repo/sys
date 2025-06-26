import React from 'react';
import { type t, Color, css, D, Media, usePointer } from './common.ts';

export const Avatar: React.FC<t.AvatarProps> = (props) => {
  const {
    debug = false,
    stream,
    muted,
    aspectRatio = D.aspectRatio,
    borderRadius = D.borderRadius,
    borderColor = D.borderColor,
    borderWidth = D.borderWidth,
  } = props;

  /**
   * Hooks:
   */
  const pointer = usePointer(props.onPointer);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: theme.alpha(0.1).bg,
      color: theme.fg,
      padding: 10,
      aspectRatio,
      borderRadius,
    }),
    border: css({
      Absolute: 0,
      pointerEvents: 'none',
      border: `solid ${borderWidth}px ${theme.format(borderColor).fg}`,
      borderRadius,
    }),
    stream: css({
      Absolute: 0,
      borderRadius,
      overflow: 'hidden',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} {...pointer.handlers}>
      <Media.Video.UI.Stream
        style={styles.stream}
        borderRadius={10}
        muted={muted}
        stream={stream}
        onReady={props.onReady}
      />
      <div className={styles.border.class} />
    </div>
  );
};
