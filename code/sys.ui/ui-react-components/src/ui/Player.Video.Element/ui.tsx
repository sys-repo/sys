import React, { useRef } from 'react';
import { type t, Color, css, D, PlayerControls, Signal, useSizeObserver } from './common.ts';
import { FadeMask } from './ui.FadeMask.tsx';
import { useScale } from './use.Scale.ts';
import { useSignalBinding } from './use.SignalBinding.ts';

export const VideoElement: React.FC<t.VideoElementProps> = (props) => {
  const { video, debug = false } = props;
  const p = video?.props;
  const src = p?.src.value;
  const aspectRatio = p?.aspectRatio.value ?? D.aspectRatio;
  const borderRadius = p?.cornerRadius.value ?? D.cornerRadius;
  const showControls = p?.showControls.value ?? D.showControls;
  const duration = p?.duration.value;
  const currentTime = p?.currentTime.value;
  const muted = p?.muted.value;
  const playing = p?.playing.value;

  const videoRef = useRef<HTMLVideoElement>(null);
  const size = useSizeObserver();
  const scale = useScale(size, p?.scale.value);
  const [isSeeking, setSeeking] = React.useState(false);
  useSignalBinding({ video, videoRef, isSeeking });

  /**
   * Effect: ensure redraw on relevant signal changes.
   */
  Signal.useRedrawEffect(() => {
    if (!p) return;
    p.ready.value;
    p.src.value;

    p.muted.value;
    p.autoPlay.value;
    p.loop.value;

    p.showControls.value;
    p.showFullscreenButton.value;
    p.showVolumeControl.value;
    p.cornerRadius.value;
    p.aspectRatio.value;
    p.scale.value;
    p.fadeMask.value;
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      aspectRatio,
      borderRadius,
      overflow: 'hidden',
    }),
    video: css({
      width: '100%',
      aspectRatio,
      display: 'block',
      objectFit: 'cover',
      borderRadius,
      transform: `scale(${scale.percent})`,
    }),
    debug: css({
      Absolute: [6, null, null, 6],
      color: theme.fg,
      fontSize: 11,
      opacity: 0.4,
    }),
    controls: css({
      Absolute: [null, 0, 0, 0],
    }),
  };

  const mask = p?.fadeMask.value;
  const elMask = mask && <FadeMask mask={mask} theme={theme.name} />;
  const elDebug = debug && <div className={styles.debug.class}>{`src: ${src}`}</div>;

  const elControls = showControls && (
    <PlayerControls
      theme={theme.name}
      style={styles.controls}
      playing={playing}
      muted={muted}
      currentTime={currentTime}
      duration={duration}
      onClick={(e) => {
        if (p) {
          if (e.control === 'Play') Signal.toggle(p.playing);
          if (e.control === 'Mute') Signal.toggle(p.muted);
        }
      }}
      onSeek={(e) => {
        setSeeking(!e.complete);
        if (video && e.complete) video.jumpTo(e.currentTime, { play: playing });
        props.onSeek?.(e);
      }}
    />
  );

  const elVideo = (
    <video
      ref={videoRef}
      className={styles.video.class}
      src={src}
      preload={'metadata'} // NB: faster paint → grabs just video/http headers first.
      controls={false}
      disablePictureInPicture={true}
      playsInline={true}
      autoPlay={p?.autoPlay.value}
      muted={p?.muted.value}
      loop={p?.loop.value}
      onEnded={(e) => {
        if (video) props.onEnded?.({ video });
      }}
    />
  );

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      {elVideo}
      {elMask}
      {elControls}
      {elDebug}
    </div>
  );
};
