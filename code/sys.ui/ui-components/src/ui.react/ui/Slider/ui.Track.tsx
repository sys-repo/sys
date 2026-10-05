import React from 'react';
import { type t, Color, css, Is } from './common.ts';
import { Wrangle } from './u.ts';

type Color = string | t.Percent;

export type TrackProps = {
  index: t.Index;
  enabled: boolean;
  percent: t.Percent;
  totalWidth: t.Pixels;
  track: t.SliderTrackProps;
  thumb: t.SliderThumbProps;
  background?: t.SliderProps['background'];
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Track: React.FC<TrackProps> = (props) => {
  const { totalWidth, thumb, track, enabled, index } = props;
  const isBottom = index === 0;
  const height = track.height;
  const percent = track.percent ?? props.percent;
  const thumbLeft = Wrangle.thumbLeft(percent, totalWidth, thumb.size);
  const progressWidth = percent === 1 ? totalWidth : thumbLeft + thumb.size / 2;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);

  const borderRadius = height / 2;
  const progressRadius = [borderRadius, 0, 0, borderRadius];
  if (percent !== props.percent || thumb.opacity === 0) {
    progressRadius[1] = borderRadius;
    progressRadius[2] = borderRadius;
  }

  const bg = props.background ?? 1;
  const bgColor = Is.number(bg) ? Color.alpha(theme.bg, bg) : bg;

  const progressBorderColor = Is.string(track.highlightBorder)
    ? track.highlightBorder
    : Color.alpha(theme.fg, track.highlightBorder);

  const progressBgColor = Is.string(track.highlight)
    ? track.highlight
    : Color.alpha(theme.bg, track.highlight);

  const styles = {
    base: css({ Absolute: 0, display: 'grid', alignContent: 'center' }),
    body: css({
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: isBottom ? bgColor : undefined,
      borderRadius,
      height,
    }),
    progress: css({
      backgroundColor: progressBgColor,
      borderRadius: progressRadius.map((num) => num + 'px').join(' '),
      border: `solid 1px ${progressBorderColor ?? 'transparent'}`,
      height: height - 2,
      Absolute: [0, null, 0, 0],
      width: progressWidth,
      opacity: percent == 0 ? 0 : enabled ? 1 : 0.3,
      transition: 'opacity 0.2s',
    }),
    border: css({
      Absolute: 0,
      borderRadius,
      border: `solid 1px ${Color.alpha(theme.fg, track.border)}`,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div className={styles.progress.class} />
        {track.border !== 0 && <div className={styles.border.class} />}
      </div>
    </div>
  );
};
