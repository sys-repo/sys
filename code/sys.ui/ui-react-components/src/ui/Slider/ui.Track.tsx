import React from 'react';
import { type t, Color, css, Is } from './common.ts';
import { Wrangle } from './u.ts';

export type TrackProps = {
  enabled: boolean;
  percent: t.Percent;
  totalWidth: t.Pixels;
  track: t.SliderTrackProps;
  thumb: t.SliderThumbProps;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Track: React.FC<TrackProps> = (props) => {
  const { totalWidth, thumb, track, enabled } = props;
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

  const styles = {
    base: css({ Absolute: 0, display: 'grid', alignContent: 'center' }),
    body: css({
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: Is.string(track.color.default)
        ? track.color.default
        : Color.alpha(Color.WHITE, track.color.default),
      borderRadius,
      height,
    }),
    progress: css({
      backgroundColor: Is.string(track.color.highlight)
        ? track.color.highlight
        : Color.alpha(theme.bg, track.color.highlight),
      borderRadius: progressRadius.map((num) => num + 'px').join(' '),
      height,
      Absolute: [0, null, 0, 0],
      width: progressWidth,
      opacity: percent == 0 ? 0 : enabled ? 1 : 0.3,
      transition: 'opacity 0.2s',
    }),
    border: css({
      Absolute: 0,
      border: `solid 1px ${Color.alpha(theme.fg, track.color.border)}`,
      borderRadius,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div className={styles.progress.class} />
        {track.color.border !== 0 && <div className={styles.border.class} />}
      </div>
    </div>
  );
};
