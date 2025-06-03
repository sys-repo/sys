import React from 'react';
import { type t, Color, css, Num, Slider } from './common.ts';

const { toPercent, fromPercent } = Num.Percent.Range;

export type SeekSliderProps = {
  currentTime: t.Secs;
  duration: t.Secs;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSeek?: t.PlayerControlSeekChangeHandler;
};

/**
 * Component:
 */
export const SeekSlider: React.FC<SeekSliderProps> = (props) => {
  const { currentTime, duration } = props;
  const range: t.MinMaxNumberRange = [0, duration];
  const percent = toPercent(currentTime, range);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      alignContent: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
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
          const currentTime = fromPercent(percent, range);
          props.onSeek?.({ currentTime, duration, percent, complete });
        }}
      />
    </div>
  );
};
