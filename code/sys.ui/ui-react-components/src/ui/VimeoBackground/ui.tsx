import React, { useState } from 'react';
import { IFrame } from '../IFrame/mod.ts';
import { type t, Color, DEFAULTS, css } from './common.ts';

type P = t.VimeoBackgroundProps;
type Ref = React.RefObject<HTMLIFrameElement>;

export const VimeoBackground: React.FC<P> = (props) => {
  const { opacity, opacityTransition = DEFAULTS.opacityTransition, blur = DEFAULTS.blur } = props;
  const [ref, setRef] = useState<Ref>();

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
        src={wrangle.src(props.video)}
        allow={'autoplay'}
        allowFullScreen={false}
        onReady={(e) => setRef(e.ref)}
      />
      <div className={styles.blurMask.class} />
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  src(video: P['video']) {
    const id = wrangle.id(video);
    return `https://player.vimeo.com/video/${id}?background=1&dnt=true`;
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
