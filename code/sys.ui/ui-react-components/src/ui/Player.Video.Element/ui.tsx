import React, { useRef } from 'react';

import { type t, Color, css, D, M, PlayerControls, Signal, useSizeObserver } from './common.ts';
import { FadeMask } from './ui.FadeMask.tsx';
import { useControlsVisibility } from './use.ControlsVisibility.ts';
import { useScale } from './use.Scale.ts';
import { useSignalBinding } from './use.SignalBinding.ts';

export const VideoElement: React.FC<t.VideoElementProps> = (props) => {
  const { video, debug = false } = props;
  const p = video?.props;
  const src = p?.src.value;
  const aspectRatio = p?.aspectRatio.value ?? D.aspectRatio;
  const borderRadius = p?.cornerRadius.value ?? D.cornerRadius;
  const showControls = p?.showControls.value ?? D.showControls;
  const muted = p?.muted.value;
  const playing = p?.playing.value;

  const ready = p?.ready.value;
  const currentTime = p?.currentTime.value;
  const duration = p?.duration.value;
  const buffering = p?.buffering.value ?? D.buffering;
  const buffered = p?.buffered.value;

  /**
   * Hooks:
   */
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isOver, setOver] = React.useState(false);
  const [isSeeking, setSeeking] = React.useState(false);
  const size = useSizeObserver();
  const scale = useScale(size, p?.scale.value);
  const controlsVisible = useControlsVisibility({ video, isOver });
  useSignalBinding({ video, videoRef, isSeeking });

  let spinning = buffering;
  if (!spinning && src && !ready) spinning = true;

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
    p.buffering.value;
    p.buffered.value;
    p.currentTime.value;

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
      opacity: !ready && currentTime === 0 ? 0 : 1,
      transition: 'opacity 300ms',
    }),
    controls: css({ Absolute: [null, 0, null, 0] }),
    debug: css({ Absolute: [6, null, null, 6], color: theme.fg, fontSize: 11, opacity: 0.4 }),
  };

  const mask = p?.fadeMask.value;
  const elMask = mask && <FadeMask mask={mask} theme={theme.name} />;
  const elDebug = debug && <div className={styles.debug.class}>{`src: ${src}`}</div>;

  const elControls = showControls && (
    <M.div
      className={styles.controls.class}
      initial={{ bottom: -20, opacity: 0 }}
      animate={{ bottom: controlsVisible ? 0 : -20, opacity: controlsVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <PlayerControls
        theme={theme.name}
        playing={playing}
        muted={muted}
        duration={duration}
        currentTime={currentTime}
        buffering={spinning}
        buffered={buffered}
        onClick={(e) => {
          if (!p) return;
          if (e.control === 'Play') Signal.toggle(p.playing);
          if (e.control === 'Mute') Signal.toggle(p.muted);
        }}
        onSeeking={(e) => {
          setSeeking(!e.complete);
          if (video && e.complete) video.jumpTo(e.currentTime, { play: playing });
          props.onSeek?.(e);
        }}
      />
    </M.div>
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
      onClick={(e) => {
        if (video) Signal.toggle(video.props.playing);
      }}
    />
  );

  return (
    <div
      ref={size.ref}
      className={css(styles.base, props.style).class}
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
    >
      {elVideo}
      {elMask}
      {elControls}
      {elDebug}
    </div>
  );
};
