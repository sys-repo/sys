import React from 'react';
import { type t, Str, Color, Cropmarks, css, dur, Is, Player, useSizeObserver } from './common.ts';

export type HarnessVideoProps = {
  deck: 'A' | 'B';
  debug?: boolean;
  video?: t.VideoPlayerSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Video: React.FC<HarnessVideoProps> = (props) => {
  const { debug = false, video, deck } = props;

  /**
   * Hooks:
   */
  const size = useSizeObserver();
  if (!video) return null;

  // This hook is the bridge: it subscribes to signals AND produces element-ready props.
  const controller = Player.Video.useSignals(video, { log: debug });
  if (!controller.props.src) return null;

  const p = video.props;

  const dms = Is.num(p.duration.value) ? p.duration.value * 1000 : 0;
  const tms = Is.num(p.currentTime.value) ? p.currentTime.value * 1000 : 0;

  const status = video.is.paused ? 'paused' : video.is.playing ? 'playing' : 'stopped';
  const src = p.src.value;
  const srcLabel = src ? Str.ellipsize(src.split('/').slice(-1)[0], [6, 10], '..') : '-';
  const sliceLabel = p.slice.value || '-/-';
  const line1 = `[${deck}] ${status}; current: ${dur(tms, '⌀')} • duration: ${dur(dms, '⌀')} • slice: ${sliceLabel}`;
  const line2 = `src: ${srcLabel}`;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    cropmarks: css({ opacity: size.ready ? 1 : 0, transition: 'opacity 100ms ease' }),
    label: {
      base: css({
        userSelect: 'none',
        fontFamily: 'monospace',
        fontSize: 9,
        lineHeight: 1.5,
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }),
      top: css({ Absolute: [-20, null, null, 0] }),
      bottom: css({ Absolute: [null, 0, -18, 0], opacity: 0.4 }),
    },
    video: css({}),
  };

  const elBody = (
    <div className={styles.video.class}>
      <Player.Video.UI
        {...controller.props}
        style={{ width: wrangle.videoWidth(size.rect?.width) }}
        debug={debug}
        theme={props.theme}
        interaction={{ clickToPlay: false }}
      />
      <div className={css(styles.label.base, styles.label.top).class}>{line1}</div>
      <div className={css(styles.label.base, styles.label.bottom).class}>{line2}</div>
    </div>
  );

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.03} style={styles.cropmarks}>
        {elBody}
      </Cropmarks>
    </div>
  );
};

const wrangle = {
  videoWidth(width?: t.Pixels) {
    if (!width) return 0;

    if (width < 440) return 240;
    if (width < 600) return 360;
    if (width < 780) return 460;
    if (width < 1040) return 560;
    return 660;
  },
} as const;
