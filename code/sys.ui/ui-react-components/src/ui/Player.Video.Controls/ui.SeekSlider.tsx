import React from 'react';
import { type t, BarSpinner, Color, css, D, Num, Slider, useSizeObserver } from './common.ts';

export type SeekSliderProps = {
  currentTime: t.Secs;
  duration: t.Secs;
  buffering?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSeek?: t.PlayerControlSeekChangeHandler;
};

/**
 * Component:
 */
export const SeekSlider: React.FC<SeekSliderProps> = (props) => {
  const { currentTime, duration, buffering = D.buffering } = props;
  const range: t.MinMaxNumberRange = [0, duration];
  const percent = Num.Percent.Range.toPercent(currentTime, range);

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
        thumb={{ size: 13, color: { default: Color.WHITE, border: 0 } }}
        track={{
          height: 5,
          color: {
            default: 0.4,
            border: 0,
            blur: 3,
            highlight: Color.LIGHT_BLUE,
            background: Color.alpha(Color.WHITE, 1),
          },
        }}
        onChange={(e) => {
          const { percent, complete } = e;
          const currentTime = Num.Percent.Range.fromPercent(percent, range);
          props.onSeek?.({ currentTime, duration, percent, complete });
        }}
      />
    </div>
  );
};
