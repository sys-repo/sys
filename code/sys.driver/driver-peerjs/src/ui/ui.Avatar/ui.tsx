import React from 'react';
import { type t, Color, css, D, M, Media, usePointer } from './common.ts';
import { Body } from './ui.Body.tsx';

type P = t.AvatarProps;

export const Avatar: React.FC<P> = (props) => {
  const {
    debug = false,
    muted = D.muted,
    aspectRatio = D.aspectRatio,
    borderRadius = D.borderRadius,
    borderColor = D.borderColor,
    borderWidth = D.borderWidth,
    flipped = D.flipped,
  } = props;

  /**
   * Hooks:
   */
  const [internalStream, setInternalStream] = React.useState(props.stream); // NB: "controlled" or "uncontrolled" stream state.
  const pointer = usePointer({
    on: props.onPointer,
    onUp(e) {
      const stream = internalStream;
      if (stream) props.onSelect?.({ stream, modifiers: e.modifiers });
    },
  });

  /**
   * Effect:
   * If the parent later passes in a stream, override internal.
   */
  React.useEffect(() => {
    if (props.stream !== undefined) setInternalStream(props.stream);
  }, [props.stream]);

  /**
   * Handlers:
   */
  const handleReady: t.MediaVideoStreamReadyHandler = (e) => {
    // NB: Only capture stream when "uncontrolled" (not passed in explicitly).
    if (internalStream === undefined) setInternalStream(e.stream.filtered);
    props.onReady?.(e);
  };

  /**
   * Render:
   */
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
    back: css({
      position: 'relative',
      backgroundColor: theme.alpha(0.05).bg,
      transform: 'rotateY(180deg)',
    }),
    video: css({ Absolute: 0, borderRadius }),
    videoBlur: css({
      Absolute: 0,
      borderRadius,
      filter: 'blur(4px)',
      opacity: theme.is.dark ? 0.2 : 0.15,
      transform: 'scaleX(-1)', // NB: mirror horizontally.
    }),
    overlay: css({
      height: '100%',
      zIndex: 1,
      color: theme.fg,
      fontSize: '1rem',
      padding: 16,
      textAlign: 'center',
      display: 'grid',
    }),
    border: css({
      Absolute: 0,
      pointerEvents: 'none',
      border: `solid ${borderWidth}px ${theme.format(borderColor).fg}`,
      borderRadius,
    }),
  };

  return (
    <M.div
      {...pointer.handlers}
      className={css(styles.base, props.style).class}
      animate={{ rotateY: flipped ? 180 : 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {/* Front. */}
      <div className={css(styles.face, styles.front).class}>
        <Media.Video.UI.Stream
          style={styles.video}
          borderRadius={borderRadius}
          muted={muted}
          stream={internalStream}
          onReady={handleReady}
        />
      </div>

      {/* Back (mirrored + blurred). */}
      <div className={css(styles.face, styles.back).class}>
        <Media.Video.UI.Stream
          style={styles.videoBlur}
          borderRadius={borderRadius}
          muted={true}
          stream={internalStream}
        />
        <div className={styles.overlay.class}>
          <Body {...props} />
        </div>
      </div>

      <div className={styles.border.class} />
    </M.div>
  );
};
