import React from 'react';
import { type t, BarSpinner, Color, css, D, Is, Num, Slider, useSizeObserver } from './common.ts';

const Range = Num.Percent.Range;

export type SeekSliderProps = {
  currentTime: t.Secs;
  duration: t.Secs;
  buffering?: boolean;
  buffered?: t.Secs;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSeeking?: t.PlayerControlSeekChangeHandler;
};

/**
 * Component:
 */
export const SeekSlider: React.FC<SeekSliderProps> = (props) => {
  const { currentTime, duration, buffering = D.buffering, buffered } = props;
  const range: t.MinMaxNumberRange = [0, duration];
  const percent = Range.toPercent(currentTime, range);
  const bufferedPercent = Is.number(buffered) ? Range.toPercent(buffered, range) : undefined;

  /**
   * Hooks:
   */
  const size = useSizeObserver();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      zIndex: 0,
      color: theme.fg,
      display: 'grid',
      alignContent: 'center',
    }),
    slider: css({
      position: 'relative',
      zIndex: 10,
    }),
    spinner: css({
      Absolute: 0,
      zIndex: 0,
      display: 'grid',
      alignContent: 'center',
      opacity: 0.8,
    }),
  };

  const elSpinner = size.ready && buffering && (
    <div className={styles.spinner.class}>
      <BarSpinner
        theme={theme.invert().name}
        width={size.width}
        height={5}
        transparentTrack={true}
      />
    </div>
  );

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      {elSpinner}
      <Slider
        percent={percent}
        thumb={{ size: 13, color: Color.WHITE, border: 0 }}
        background={0.4}
        track={wrangle.track(bufferedPercent)}
        onChange={(e) => {
          const { percent, complete } = e;
          const currentTime = Range.fromPercent(percent, range);
          props.onSeeking?.({ currentTime, duration, percent, complete });
        }}
      />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  track(buffered?: t.Percent): Partial<t.SliderTrackProps>[] {
    const height = 5;
    const border = 0;
    const res: Partial<t.SliderTrackProps>[] = [
      {
        height,
        border,
        highlight: Color.LIGHT_BLUE,
        highlightBorder: Color.alpha(Color.WHITE, 0.3),
      },
    ];

    if (Is.number(buffered)) {
      res.unshift({
        height,
        border,
        highlight: Color.alpha(Color.WHITE, 0.5),
        percent: buffered,
      });
    }

    return res;
  },
} as const;
