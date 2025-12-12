import React from 'react';
import {
  type t,
  Color,
  Cropmarks,
  css,
  dur,
  Is,
  Player,
  Signal,
  useSizeObserver,
} from './common.ts';

export type HarnessVideoProps = {
  debug?: boolean;
  video?: t.VideoPlayerSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Video: React.FC<HarnessVideoProps> = (props) => {
  const { debug = false, video } = props;

  console.log('video', video);

  /**
   * Hooks:
   */
  const size = useSizeObserver();
  const controller = Player.Video.useSignals(video, { log: debug });
  if (!controller.props.src) return null;
  if (!video) return null;

  const p = video.props;
  let dms = Is.num(p.duration.value) ? p.duration.value * 1000 : 0;
  const info = `duration: ${dur(dms)}, slice: ${p.slice.value || '-/-'}`;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
    cropmarks: css({
      opacity: size.ready ? 1 : 0,
      transition: 'opacity 100ms ease',
    }),
    body: css({ position: 'relative' }),
    label: css({
      Absolute: [null, 0, -20, 5],
      fontFamily: 'monospace',
      fontSize: 9,
    }),
  };

  const elBody = (
    <div>
      <Player.Video.Element
        style={{ width: wrangle.videoWidth(size.rect?.width) }}
        debug={debug}
        theme={props.theme}
        muted={true}
        {...controller.props}
      />
      <div className={styles.label.class}>{info}</div>
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

    // Narrow: stack / tiny panes
    if (width < 420) return 220;

    // Small
    if (width < 560) return 320;

    // Medium (sweet spot)
    if (width < 740) return 420;

    // Large
    if (width < 980) return 520;

    // XL (don’t go silly)
    return 620;
  },
} as const;
