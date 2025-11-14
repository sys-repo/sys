import React from 'react';
import {
  type t,
  Color,
  RectGrid,
  css,
  Num,
  ObjectView,
  Str,
  useVirtualPlayback,
  useVirtualTimeline,
  VideoElement,
} from './common.ts';
import { render } from '../Preload/u.render.tsx';

type P = t.CompositeVideoProps;

/**
 * Component:
 */
export const CompositeVideo: React.FC<P> = (props) => {
  const { debug = false, videos, startAt, autoPlay, loop } = props;

  /**
   * Hooks:
   */
  const timeline = useVirtualTimeline(videos);
  const playback = useVirtualPlayback(timeline, {
    startAt,
    autoPlay,
    loop,
    speed: 1,
  });

  console.group(`🐷`);
  console.log('timeline', timeline);
  console.log('playback', playback);
  console.groupEnd();

  React.useEffect(() => {
    if (!timeline) return;
    props.onReady?.({ total: timeline.total, timeline });
  }, [timeline.rev]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
    obj: {
      // Anchor container just outside the right edge of the player:
      base: css({
        position: 'absolute',
        top: 0,
        left: '100%',
        transform: 'translateX(15px) translateY(10px)',
        width: 'max-content',
        maxWidth: 'min(46vw, 720px)',
      }),
      inner: css({
        display: 'block',
        width: 'auto',
        maxWidth: '100%',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
      }),
    },
    videos: css({}),
  };

  const elObj = debug && (
    <div className={styles.obj.base.class}>
      <ObjectView
        style={styles.obj.inner}
        name={'playback'}
        data={{
          vtime: Num.round(playback.vtime),
          index: playback.index,
          seg: playback.seg,
          src: Str.ellipsize(playback.seg?.src, [15, 20]),
        }}
        theme={theme.name}
        expand={1}
      />
    </div>
  );

  const aspectRatio = 4 / 3;

  const renderVideo = (index: t.Index, src?: string) => {
    const isCurrent = index === playback.index;
    return (
      <VideoElement
        key={index}
        showControls={false}
        src={src}
        cornerRadius={10}
        aspectRatio={aspectRatio}
        playing={isCurrent}
        theme={theme.name}
        muted={true}
        style={{
          width: '100%',
          opacity: isCurrent ? 1 : 0.3,
          filter: isCurrent ? 'none' : 'grayscale(100%) brightness(0.8)',
          transition: 'opacity 120ms ease, filter 200ms ease',
        }}
      />
    );
  };

  const items = (timeline?.segments ?? []).map((seg, i) => ({
    id: `item-${i}`,
    render() {
      return renderVideo(i, seg.src);
    },
  }));

  const elVideos = <RectGrid theme={theme.name} items={items} aspectRatio={aspectRatio} />;

  return (
    <div className={css(styles.base, props.style).class}>
      {elVideos}
      {elObj}
    </div>
  );
};
