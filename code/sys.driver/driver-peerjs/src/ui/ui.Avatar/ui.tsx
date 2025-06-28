import React from 'react';
import { type t, Color, css, D, M, Media, usePointer } from './common.ts';

export const Avatar: React.FC<t.AvatarProps> = (props) => {
  const {
    debug = false,
    stream,
    muted = D.muted,
    aspectRatio = D.aspectRatio,
    borderRadius = D.borderRadius,
    borderColor = D.borderColor,
    borderWidth = D.borderWidth,
    flipped = D.flipped,
  } = props;

  /* Pointer */
  const pointer = usePointer((e) => {
    props.onPointer?.(e);
    const modifiers = e.trigger.modifiers;
    if (e.is.down && stream) props.onSelect?.({ stream, modifiers });
  });

  /* Styles */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      width: '100%',
      aspectRatio,
      perspective: 800,
      transformStyle: 'preserve-3d',
      borderRadius,
    }),
    face: css({
      Absolute: 0,
      width: '100%',
      height: '100%',
      borderRadius,
      backfaceVisibility: 'hidden',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    front: css({ backgroundColor: theme.alpha(0.1).bg }),
    back: css({ backgroundColor: theme.alpha(0.05).bg, transform: 'rotateY(180deg)' }),
    video: css({ Absolute: 0, borderRadius }),
    videoBlur: css({
      Absolute: 0,
      borderRadius,
      filter: 'blur(4px)',
      opacity: theme.is.dark ? 0.2 : 0.15,
      transform: 'scaleX(-1)', // mirror horizontally
    }),
    overlay: css({
      position: 'relative',
      zIndex: 1,
      color: theme.fg,
      fontSize: '1rem',
      padding: 16,
      textAlign: 'center',
      pointerEvents: 'none',
    }),
    border: css({
      Absolute: 0,
      pointerEvents: 'none',
      border: `solid ${borderWidth}px ${theme.format(borderColor).fg}`,
      borderRadius,
    }),
  };

  /**
   * Render:
   */
  return (
    <M.div
      {...pointer.handlers}
      className={css(styles.base, props.style).class}
      animate={{ rotateY: flipped ? 180 : 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {/* Front */}
      <div className={css(styles.face, styles.front).class}>
        <Media.Video.UI.Stream
          style={styles.video}
          borderRadius={borderRadius}
          muted={muted}
          stream={stream}
          onReady={props.onReady}
        />
      </div>

      {/* Back (mirrored + blurred) */}
      <div className={css(styles.face, styles.back).class}>
        <Media.Video.UI.Stream
          style={styles.videoBlur}
          borderRadius={borderRadius}
          muted={true}
          stream={stream}
        />
        <div className={styles.overlay.class}>{debug ? 'debug' : 'Config 🐷'}</div>
      </div>

      <div className={styles.border.class} />
    </M.div>
  );
};
