import React from 'react';
import {
  type t,
  Str,
  Color,
  Cropmarks,
  css,
  dur,
  Is,
  Player,
  useSizeObserver,
  Button,
  Try,
} from './common.ts';

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
  const [lastJumpTo, setLastJumpTo] = React.useState<t.VideoPlayerSeek | undefined>(undefined);

  /**
   * Hooks:
   */
  const size = useSizeObserver();

  // This hook is the bridge: it subscribes to signals AND produces element-ready props.
  const controller = Player.Video.useSignals(video, { log: debug });
  const p = video?.props;

  React.useEffect(() => {
    if (!p?.jumpTo.value) return;
    setLastJumpTo(p.jumpTo.value);
  }, [p?.jumpTo.value]);

  if (!p || !video || !controller.props.src) return null;

  const dms = Is.num(p.duration.value) ? p.duration.value * 1000 : 0;
  const tms = Is.num(p.currentTime.value) ? p.currentTime.value * 1000 : 0;

  const status = video.is.paused ? 'paused' : video.is.playing ? 'playing' : 'stopped';
  const src = p.src.value;
  const srcLabel = src ? Str.ellipsize(src.split('/').slice(-1)[0], [6, 10], '..') : '-';
  const sliceLabel = p.slice.value || '-/-';
  const readyLabel = p.ready.value ? 'ready' : 'not-ready';
  const jumpTo = p.jumpTo.value;
  const jumpLabel = jumpTo ? `${jumpTo.second}s` : '-';
  const lastJumpLabel = lastJumpTo ? `${lastJumpTo.second}s` : '-';
  const jumpPlay = jumpTo?.play === true ? 'play' : jumpTo?.play === false ? 'pause' : 'keep';
  const line1 = `[${deck}] ${status}; ${readyLabel} • current: ${dur(tms, '⌀')} • duration: ${dur(
    dms,
    '⌀',
  )} • slice: ${sliceLabel}`;
  const line2 = `jumpTo: ${jumpLabel} (${jumpPlay}) • last: ${lastJumpLabel}`;
  const line3 = `src: ${srcLabel}`;
  const debugPayload = {
    deck,
    status,
    ready: p.ready.value,
    currentTime: p.currentTime.value,
    duration: p.duration.value,
    jumpTo: p.jumpTo.value,
    lastJumpTo,
    src: p.src.value,
    slice: p.slice.value,
  };

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

  const handleCopy = () => {
    // Best-effort clipboard write.
    Try.run(() => navigator.clipboard.writeText(JSON.stringify(debugPayload)));
  };

  const elBody = (
    <div className={styles.video.class}>
      <Player.Video.Element
        {...controller.props}
        style={{ width: wrangle.videoWidth(size.rect?.width) }}
        debug={debug}
        theme={props.theme}
        interaction={{ clickToPlay: false }}
      />
      <Button
        theme={theme.name}
        style={css(styles.label.base, styles.label.top)}
        onClick={handleCopy}
        label={line1}
      />
      <div className={css(styles.label.base, styles.label.bottom).class}>{line3}</div>
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
