import React, { useEffect, useRef, useState } from 'react';
import { IFrame } from '../IFrame/mod.ts';
import { Vimeo } from './api.Vimeo.ts';
import { type t, Color, DEFAULTS, Time, css, rx } from './common.ts';

const D = DEFAULTS;

type P = t.VimeoBackgroundProps;
type Ref = React.RefObject<HTMLIFrameElement>;

export const VimeoBackground: React.FC<P> = (props) => {
  const {
    opacity,
    jumpTo,
    blur = D.blur,
    opacityTransition = D.opacityTransition,
    playingTransition = D.playingTransition,
  } = props;

  const vimeoRef = useRef<t.VimeoIFrame>();
  const [playing, setPlaying] = useState(props.playing ?? D.playing);

  const [iframe, setIframe] = useState<HTMLIFrameElement>();
  const initialPlaying = useRef(playing);
  const src = wrangle.src(props.video, initialPlaying.current);

  /**
   * POST: post a message to the vimeo player embedded in the <IFrame>.
   */
  const post = (method: string, value?: number | string) => {
    if (iframe) Vimeo.create(iframe).post(method, value);
  };

  /**
   * Effect: Play/Pause the video via the Vimeo bridge/API.
   */
  useEffect(() => {
    post(playing ? 'play' : 'pause');
  }, [iframe, playing]);

  /**
   * Effect: playing transition.
   */
  React.useEffect(() => {
    const life = rx.lifecycle();
    const next = props.playing ?? D.playing;

    if (!playingTransition) {
      setPlaying(next); // NB: 0 or undefined - immediate change.
    } else {
      // Make the change after the specified delay.
      const time = Time.until(life);
      time.delay(playingTransition, () => setPlaying(next));
    }

    return life.dispose;
  }, [iframe, props.playing, playing, playingTransition]);

  /**
   * Effect
   */
  React.useEffect(() => {
    if (iframe) {
      const api = Vimeo.create(iframe);
      vimeoRef.current = api;
      props.onReady?.(api);
    }
  }, [iframe]);

  /**
   * Effect: jumpTo (timestamp).
   */
  useEffect(() => {
    if (jumpTo !== undefined) post('setCurrentTime', jumpTo);
  }, [iframe, jumpTo]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      overflow: 'hidden',
      opacity: opacity === undefined ? 1 : opacity,
      transition: opacityTransition ? `opacity ${opacityTransition}ms` : undefined,
      pointerEvents: 'none',
    }),
    iframe: css({
      userSelect: 'none',
      boxSizing: 'border-box',
      height: '56.25vw',
      left: '50%',
      minHeight: '100%',
      minWidth: '100%',
      transform: 'translate(-50%, -50%)',
      position: 'absolute',
      top: '50%',
      width: '177.77777778vh',
      overflow: 'hidden',
      border: 'none',
    }),
    blurMask: css({
      Absolute: 0,
      backdropFilter: `blur(${blur}px)`,
      opacity: 0.9,
      transition: opacityTransition
        ? `opacity ${opacityTransition}ms, backdrop-filter ${opacityTransition}ms`
        : undefined,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <IFrame
        style={styles.iframe}
        src={src}
        allow={'autoplay'}
        allowFullScreen={false}
        onReady={(e) => setIframe(e.ref.current ?? undefined)}
      />
      <div className={styles.blurMask.class} />
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  src(video: P['video'], playing: P['playing']) {
    const id = wrangle.id(video);
    const autoplay = playing ? '1' : '0';
    const base = 'https://player.vimeo.com/video';
    return `${base}/${id}?background=1&dnt=true&autoplay=${autoplay}`;
  },

  id(video: P['video']) {
    if (typeof video === 'number') return video;
    if (typeof video === 'string' && video.startsWith('vimeo/')) {
      const [, id] = video.split('/');
      return id;
    }
    throw new Error(`Failed to parse 'video' prop as a Vimeo ID: ${video}`);
  },
} as const;
